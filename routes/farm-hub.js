const express = require('express');
const crypto = require('crypto');
const { col } = require('../lib/db');
const { auth } = require('../lib/auth');

const router = express.Router();
const partners = col('farm_partners');
const tasks = col('farm_tasks');
const subscriptions = col('vertical_subscriptions');
const orders = col('vertical_orders');
const ROLES = new Set(['farm-operator', 'delivery-partner']);
const PLANS = new Set(['greens-weekly', 'farm-box', 'herb-box']);
const FARMS = new Map([
  ['greenleaf-urban', { name: 'GreenLeaf Urban Farm', monthlyPrice: 799 }],
  ['berrystack', { name: 'BerryStack Farm', monthlyPrice: 999 }],
  ['herbnest', { name: 'HerbNest Farm', monthlyPrice: 599 }],
]);
const PRODUCTS = new Map([
  ['lettuce', { name: 'Lettuce bundle', demoPrice: 120 }],
  ['spinach', { name: 'Spinach bundle', demoPrice: 80 }],
  ['herbs', { name: 'Fresh herb pack', demoPrice: 90 }],
  ['mixed-greens', { name: 'Mixed greens box', demoPrice: 180 }],
]);
const clean = (value, max) => String(value || '').trim().slice(0, max);
const hasRole = (userId, role) => partners.rows.some((p) => p.userId === userId && p.role === role);

function taskView(task, userId) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    requiredRole: task.requiredRole,
    location: task.location,
    dueDate: task.dueDate || '',
    status: task.status,
    isDemo: !!task.isDemo,
    createdAt: task.createdAt || '',
    assignedToMe: task.assignedTo === userId,
    mine: task.createdBy === userId,
    isAssigned: !!task.assignedTo,
  };
}

router.get('/farm-hub', auth, (req, res) => {
  const visiblePartners = partners.rows.map((partner) => ({
    id: partner.id,
    name: partner.name,
    role: partner.role,
    location: partner.location,
    skills: Array.isArray(partner.skills) ? partner.skills : [],
    isDemo: !!partner.isDemo,
    createdAt: partner.createdAt || '',
  }));
  res.json({
    partners: visiblePartners,
    tasks: tasks.rows.map((task) => taskView(task, req.user.id)),
    myRoles: partners.rows.filter((p) => p.userId === req.user.id).map((p) => p.role),
  });
});

router.post('/farm-hub/partners', auth, (req, res) => {
  const body = req.body || {};
  const role = clean(body.role, 30);
  if (!ROLES.has(role)) return res.status(400).json({ error: 'Choose Farm Operator or Delivery Partner.' });
  const location = clean(body.location, 100);
  if (location.length < 2) return res.status(400).json({ error: 'Enter your farm or delivery area.' });
  const skills = (Array.isArray(body.skills) ? body.skills : [])
    .map((skill) => clean(skill, 40))
    .filter(Boolean)
    .slice(0, 6);
  if (!skills.length) return res.status(400).json({ error: 'Add at least one relevant skill or service.' });

  const existing = partners.rows.find((p) => p.userId === req.user.id && p.role === role);
  if (existing) return res.status(409).json({ error: 'You are already listed for this partner role.' });

  const partner = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    name: clean(req.user.name, 80),
    role,
    location,
    skills,
    isDemo: false,
    createdAt: new Date().toISOString(),
  };
  partners.rows.push(partner);
  partners.save();
  res.status(201).json({
    partner: { id: partner.id, name: partner.name, role: partner.role, location: partner.location, skills: partner.skills, isDemo: false },
  });
});

router.post('/farm-hub/tasks', auth, (req, res) => {
  if (!hasRole(req.user.id, 'farm-operator')) {
    return res.status(403).json({ error: 'Register as a Farm Operator before posting work.' });
  }
  if (tasks.rows.filter((task) => task.createdBy === req.user.id && task.status !== 'done').length >= 30) {
    return res.status(400).json({ error: 'You have reached the active task limit.' });
  }
  const body = req.body || {};
  const title = clean(body.title, 80);
  const description = clean(body.description, 500);
  const location = clean(body.location, 100);
  const requiredRole = clean(body.requiredRole, 30);
  const dueDate = clean(body.dueDate, 10);
  if (title.length < 3) return res.status(400).json({ error: 'Give the task a short, clear title.' });
  if (!description) return res.status(400).json({ error: 'Describe the work to be done.' });
  if (location.length < 2) return res.status(400).json({ error: 'Enter the work location.' });
  if (!ROLES.has(requiredRole)) return res.status(400).json({ error: 'Choose who should do this work.' });
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return res.status(400).json({ error: 'Enter a valid due date.' });

  const task = {
    id: crypto.randomUUID(),
    title,
    description,
    requiredRole,
    location,
    dueDate,
    status: 'available',
    createdBy: req.user.id,
    assignedTo: null,
    isDemo: false,
    createdAt: new Date().toISOString(),
  };
  tasks.rows.unshift(task);
  tasks.save();
  res.status(201).json({ task: taskView(task, req.user.id) });
});

router.post('/farm-hub/tasks/:id/claim', auth, (req, res) => {
  const task = tasks.rows.find((item) => item.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Work listing not found.' });
  if (!hasRole(req.user.id, task.requiredRole)) {
    return res.status(403).json({ error: 'Register for the role shown on this task before accepting it.' });
  }
  if (task.status !== 'available' || task.assignedTo) {
    return res.status(409).json({ error: 'This task is no longer available.' });
  }
  task.assignedTo = req.user.id;
  task.status = 'assigned';
  task.assignedAt = new Date().toISOString();
  tasks.save();
  res.json({ task: taskView(task, req.user.id) });
});

router.patch('/farm-hub/tasks/:id/status', auth, (req, res) => {
  const task = tasks.rows.find((item) => item.id === req.params.id);
  if (!task || task.assignedTo !== req.user.id) return res.status(404).json({ error: 'Your assigned task was not found.' });
  const status = clean((req.body || {}).status, 20);
  const allowed = (task.status === 'assigned' && status === 'in-progress') ||
    (task.status === 'in-progress' && status === 'done');
  if (!allowed) return res.status(409).json({ error: 'Tasks move from Assigned to In progress, then Completed.' });
  task.status = status;
  task.updatedAt = new Date().toISOString();
  tasks.save();
  res.json({ task: taskView(task, req.user.id) });
});

router.get('/vertical-farming/subscriptions', auth, (req, res) => {
  res.json({
    subscriptions: subscriptions.rows
      .filter((item) => item.userId === req.user.id)
      .map(({ id, planId, farmId, status, isDemo, createdAt }) => ({ id, planId, farmId, status, isDemo, createdAt })),
  });
});

router.post('/vertical-farming/subscriptions', auth, (req, res) => {
  const body = req.body || {};
  const farmId = clean(body.farmId, 40);
  const planId = clean(body.planId, 40);
  if ((farmId && (!FARMS.has(farmId) || planId)) || (!farmId && !PLANS.has(planId))) {
    return res.status(400).json({ error: 'Choose one of the sample farms or plans shown.' });
  }
  const existing = subscriptions.rows.find((item) => item.userId === req.user.id &&
    (farmId ? item.farmId === farmId : item.planId === planId));
  if (existing) {
    return res.json({
      subscription: { id: existing.id, planId: existing.planId, farmId: existing.farmId, status: existing.status, isDemo: true, createdAt: existing.createdAt },
    });
  }
  const item = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    planId: PLANS.has(planId) ? planId : null,
    farmId: FARMS.has(farmId) ? farmId : null,
    status: 'demo-requested',
    isDemo: true,
    createdAt: new Date().toISOString(),
  };
  subscriptions.rows.push(item);
  subscriptions.save();
  res.status(201).json({
    subscription: { id: item.id, planId: item.planId, farmId: item.farmId, status: item.status, isDemo: true, createdAt: item.createdAt },
  });
});

router.get('/vertical-farming/orders', auth, (req, res) => {
  res.json({
    orders: orders.rows
      .filter((item) => item.userId === req.user.id)
      .map(({ id, productId, quantity, status, demoTotalInr, createdAt }) => ({ id, productId, quantity, status, demoTotalInr, createdAt })),
  });
});

router.post('/vertical-farming/orders', auth, (req, res) => {
  const body = req.body || {};
  const productId = clean(body.productId, 40);
  const product = PRODUCTS.get(productId);
  const quantity = Number(body.quantity);
  if (!product) return res.status(400).json({ error: 'Choose one of the sample produce items shown.' });
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    return res.status(400).json({ error: 'Quantity must be a whole number from 1 to 20.' });
  }
  const item = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    productId,
    quantity,
    status: 'demo-order-requested',
    demoTotalInr: product.demoPrice * quantity,
    isDemo: true,
    createdAt: new Date().toISOString(),
  };
  orders.rows.push(item);
  orders.save();
  res.status(201).json({
    order: { id: item.id, productId: item.productId, quantity: item.quantity, status: item.status, demoTotalInr: item.demoTotalInr, isDemo: true, createdAt: item.createdAt },
  });
});

module.exports = { router };
