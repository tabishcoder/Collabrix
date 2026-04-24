const express = require('express');
const router  = express.Router();
const { auth } = require('../middleware/auth');
const { requireProjectRole } = require('../middleware/authorize');
const {
  getProjectsBySpace,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  updateBoardColumns,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember
} = require('../controller/projects.controller');

const MANAGE = ['owner', 'admin', 'manager'];
const WRITE  = ['owner', 'admin', 'manager', 'contributor'];
const READ   = ['owner', 'admin', 'manager', 'contributor', 'viewer'];

// Projects CRUD
router.get('/space/:spaceId', auth, getProjectsBySpace);
router.get('/:id',            auth, getProjectById);
router.post('/',              auth, createProject);
router.put('/:id',            auth, requireProjectRole(MANAGE), updateProject);
router.delete('/:id',         auth, requireProjectRole(MANAGE), deleteProject);

// Board columns (managers+)
router.put('/:id/board-columns', auth, requireProjectRole(MANAGE), updateBoardColumns);

// Project members
router.post('/:id/members',                 auth, requireProjectRole(MANAGE), addProjectMember);
router.put('/:id/members/:userId/role',     auth, requireProjectRole(MANAGE), updateProjectMemberRole);
router.delete('/:id/members/:userId',       auth, requireProjectRole(MANAGE), removeProjectMember);

module.exports = router;
