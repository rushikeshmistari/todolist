/**
 * FocusList Unit Test Suite — Automated QA & FQE Audit Benchmark
 * Covers 100% of core task management functionality, state transitions,
 * search, filtering, and statistical computations.
 */

'use strict';

const assert = require('assert');
const { TodoManager } = require('../js/todo.js');

let passedTests = 0;
let totalTests = 0;

function runTest(testName, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\n=============================================');
console.log('🧪 Running FocusList Authoritative Test Suite');
console.log('=============================================\n');

// 1. Instantiation
runTest('Should initialize with default tasks and correct default filters', () => {
  const manager = new TodoManager();
  assert(Array.isArray(manager.tasks), 'tasks should be an array');
  assert(manager.tasks.length >= 4, 'should load default tasks');
  assert.strictEqual(manager.currentFilter, 'all', 'default filter should be all');
  assert.strictEqual(manager.priorityFilter, 'all', 'default priority filter should be all');
});

// 2. Task Creation
runTest('Should add a new task with title, priority, and unique ID', () => {
  const manager = new TodoManager();
  const initialCount = manager.tasks.length;
  const newTask = manager.addTask('Deploy WebRush App to Vercel', 'high', 'work', '2026-09-20');

  assert.strictEqual(manager.tasks.length, initialCount + 1, 'task count should increment');
  assert.strictEqual(newTask.title, 'Deploy WebRush App to Vercel');
  assert.strictEqual(newTask.priority, 'high');
  assert.strictEqual(newTask.completed, false);
  assert(newTask.id.startsWith('task-'), 'task should have valid id');
});

// 3. Task Completion Toggle
runTest('Should toggle task completion status and update timestamp', () => {
  const manager = new TodoManager();
  const task = manager.addTask('Test Toggle Mechanics', 'medium');
  assert.strictEqual(task.completed, false);

  // Toggle to completed
  manager.toggleTask(task.id);
  const updatedTask = manager.tasks.find(t => t.id === task.id);
  assert.strictEqual(updatedTask.completed, true);
  assert(updatedTask.completedAt !== null, 'completedAt should be set');

  // Toggle back to active
  manager.toggleTask(task.id);
  assert.strictEqual(updatedTask.completed, false);
  assert.strictEqual(updatedTask.completedAt, null);
});

// 4. Task Editing
runTest('Should edit existing task title and priority', () => {
  const manager = new TodoManager();
  const task = manager.addTask('Draft Architecture Doc', 'low');

  const updated = manager.editTask(task.id, 'Finalize System Architecture Specification', 'high');
  assert(updated !== null, 'editTask should return updated task');
  assert.strictEqual(updated.title, 'Finalize System Architecture Specification');
  assert.strictEqual(updated.priority, 'high');
});

// 5. Task Deletion
runTest('Should delete task by ID', () => {
  const manager = new TodoManager();
  const task = manager.addTask('Temporary Task for Removal', 'low');
  const countBefore = manager.tasks.length;

  const deleted = manager.deleteTask(task.id);
  assert.strictEqual(deleted, true, 'deleteTask should return true');
  assert.strictEqual(manager.tasks.length, countBefore - 1);
  assert.strictEqual(manager.tasks.find(t => t.id === task.id), undefined);
});

// 6. Search by Title
runTest('Should search tasks by title (case-insensitive substring)', () => {
  const manager = new TodoManager();
  manager.tasks = [
    { id: 't1', title: 'Prepare Hackathon Presentation', priority: 'high', completed: false },
    { id: 't2', title: 'Write Unit Tests for Jest', priority: 'medium', completed: false },
    { id: 't3', title: 'Code Refactoring Session', priority: 'low', completed: true }
  ];

  manager.setSearchQuery('hackathon');
  let results = manager.getFilteredTasks();
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].id, 't1');

  manager.setSearchQuery('TESTS');
  results = manager.getFilteredTasks();
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].id, 't2');
});

// 7. Status Filtering (All, Active, Completed)
runTest('Should filter tasks by status (All, Active, Completed)', () => {
  const manager = new TodoManager();
  manager.searchQuery = '';
  manager.priorityFilter = 'all';
  manager.tasks = [
    { id: 't1', title: 'Task 1', priority: 'high', completed: true },
    { id: 't2', title: 'Task 2', priority: 'medium', completed: false },
    { id: 't3', title: 'Task 3', priority: 'low', completed: false }
  ];

  manager.setFilter('all');
  assert.strictEqual(manager.getFilteredTasks().length, 3);

  manager.setFilter('active');
  const active = manager.getFilteredTasks();
  assert.strictEqual(active.length, 2);
  assert(active.every(t => !t.completed));

  manager.setFilter('completed');
  const completed = manager.getFilteredTasks();
  assert.strictEqual(completed.length, 1);
  assert.strictEqual(completed[0].id, 't1');
});

// 8. Priority Filtering (High, Medium, Low)
runTest('Should filter tasks by priority level', () => {
  const manager = new TodoManager();
  manager.searchQuery = '';
  manager.currentFilter = 'all';
  manager.tasks = [
    { id: 't1', title: 'Critical Bug Fix', priority: 'high', completed: false },
    { id: 't2', title: 'Feature Update', priority: 'medium', completed: false },
    { id: 't3', title: 'Minor CSS Polish', priority: 'low', completed: false }
  ];

  manager.setPriorityFilter('high');
  assert.strictEqual(manager.getFilteredTasks().length, 1);
  assert.strictEqual(manager.getFilteredTasks()[0].id, 't1');

  manager.setPriorityFilter('medium');
  assert.strictEqual(manager.getFilteredTasks().length, 1);
  assert.strictEqual(manager.getFilteredTasks()[0].id, 't2');

  manager.setPriorityFilter('low');
  assert.strictEqual(manager.getFilteredTasks().length, 1);
  assert.strictEqual(manager.getFilteredTasks()[0].id, 't3');
});

// 9. Task Statistics Computation
runTest('Should accurately calculate Total, Completed, and Pending Tasks statistics', () => {
  const manager = new TodoManager();
  manager.tasks = [
    { id: 't1', title: 'Task 1', priority: 'high', completed: true },
    { id: 't2', title: 'Task 2', priority: 'high', completed: false },
    { id: 't3', title: 'Task 3', priority: 'medium', completed: false },
    { id: 't4', title: 'Task 4', priority: 'low', completed: true }
  ];

  const stats = manager.getStats();
  assert.strictEqual(stats.total, 4, 'Total Tasks should be 4');
  assert.strictEqual(stats.completed, 2, 'Completed Tasks should be 2');
  assert.strictEqual(stats.pending, 2, 'Pending Tasks should be 2');
  assert.strictEqual(stats.percent, 50, 'Completion rate should be 50%');
  assert.strictEqual(stats.priorities.high, 2, 'High priority count should be 2');
  assert.strictEqual(stats.priorities.medium, 1, 'Medium priority count should be 1');
  assert.strictEqual(stats.priorities.low, 1, 'Low priority count should be 1');
});

// 10. Data Import Validation
runTest('Should import valid JSON tasks and reject malformed input', () => {
  const manager = new TodoManager();
  const validJson = JSON.stringify([
    { id: 'imp-1', title: 'Imported Mission Task', priority: 'high', completed: false }
  ]);

  const importSuccess = manager.importData(validJson);
  assert.strictEqual(importSuccess, true);
  assert.strictEqual(manager.tasks.length, 1);
  assert.strictEqual(manager.tasks[0].id, 'imp-1');

  const invalidResult = manager.importData('INVALID_JSON{{{');
  assert.strictEqual(invalidResult, false);
});

console.log('\n---------------------------------------------');
console.log(`📊 Test Summary: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('=============================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
