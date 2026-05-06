const meetingService = require('../services/communication/meetingService');

const getIO = (req) => req.app.get('io');

function userSocketPayload(user) {
  if (!user) return null;
  return { _id: user._id, name: user.name, email: user.email };
}

function meetingSummaryForSocket(m) {
  const meeting = m.toObject ? m.toObject({ virtuals: false }) : m;
  return {
    meetingId: String(meeting._id),
    title: meeting.title,
    status: meeting.status,
    groupId: meeting.groupId,
    projectId: meeting.projectId,
    createdBy: meeting.createdBy,
    participants: meetingService.buildParticipantPayload({ participants: meeting.participants || [] }),
  };
}

function meetingJsonBody(m) {
  const meeting = m.toObject ? m.toObject({ virtuals: false }) : m;
  return {
    _id: meeting._id,
    title: meeting.title,
    status: meeting.status,
    groupId: meeting.groupId,
    projectId: meeting.projectId,
    createdBy: meeting.createdBy,
    participants: meetingService.buildParticipantPayload({ participants: meeting.participants || [] }),
    endedAt: meeting.endedAt,
    createdAt: meeting.createdAt,
    updatedAt: meeting.updatedAt,
  };
}

module.exports.createMeeting = async (req, res) => {
  try {
    const { title, projectId } = req.body;
    const { meeting, acs } = await meetingService.createMeeting(req.user._id, { title, projectId });

    const io = getIO(req);
    const meetingId = String(meeting._id);
    if (io) {
      io.to(`meeting-${meetingId}`).emit('meeting:started', {
        meetingId,
        user: userSocketPayload(req.user),
        meeting: meetingSummaryForSocket(meeting),
      });
    }

    return res.status(201).json({
      meeting: meetingJsonBody(meeting),
      acs: {
        groupId: meeting.groupId,
        communicationUserId: acs.communicationUserId,
        token: acs.token,
        expiresOn: acs.expiresOn,
      },
    });
  } catch (e) {
    const status = e.statusCode || 500;
    if (status >= 500) console.error(e);
    return res.status(status).json({ message: e.message || 'Server error' });
  }
};

module.exports.joinMeeting = async (req, res) => {
  try {
    const { meeting, acs, alreadyPresent } = await meetingService.joinMeeting(req.params.id, req.user._id);

    const io = getIO(req);
    const meetingId = String(meeting._id);
    if (io) {
      io.to(`meeting-${meetingId}`).emit('meeting:user-joined', {
        meetingId,
        user: userSocketPayload(req.user),
        alreadyPresent: !!alreadyPresent,
        meeting: meetingSummaryForSocket(meeting),
      });
    }

    return res.json({
      meeting: meetingJsonBody(meeting),
      acs: {
        groupId: meeting.groupId,
        communicationUserId: acs.communicationUserId,
        token: acs.token,
        expiresOn: acs.expiresOn,
      },
    });
  } catch (e) {
    const status = e.statusCode || 500;
    if (status >= 500) console.error(e);
    return res.status(status).json({ message: e.message || 'Server error' });
  }
};

module.exports.leaveMeeting = async (req, res) => {
  try {
    const { meeting } = await meetingService.leaveMeeting(req.params.id, req.user._id);

    const io = getIO(req);
    const meetingId = String(meeting._id);
    if (io) {
      io.to(`meeting-${meetingId}`).emit('meeting:user-left', {
        meetingId,
        user: userSocketPayload(req.user),
        meeting: meetingSummaryForSocket(meeting),
      });
    }

    return res.json({ meeting: meetingJsonBody(meeting) });
  } catch (e) {
    const status = e.statusCode || 500;
    if (status >= 500) console.error(e);
    return res.status(status).json({ message: e.message || 'Server error' });
  }
};

module.exports.endMeeting = async (req, res) => {
  try {
    const { meeting } = await meetingService.endMeeting(req.params.id, req.user._id);

    const io = getIO(req);
    const meetingId = String(meeting._id);
    if (io) {
      io.to(`meeting-${meetingId}`).emit('meeting:ended', {
        meetingId,
        user: userSocketPayload(req.user),
        meeting: meetingSummaryForSocket(meeting),
      });
    }

    return res.json({ meeting: meetingJsonBody(meeting) });
  } catch (e) {
    const status = e.statusCode || 500;
    if (status >= 500) console.error(e);
    return res.status(status).json({ message: e.message || 'Server error' });
  }
};

module.exports.getMeetingById = async (req, res) => {
  try {
    const { meeting } = await meetingService.getMeetingById(req.params.id, req.user._id);
    return res.json({ meeting });
  } catch (e) {
    const status = e.statusCode || 500;
    if (status >= 500) console.error(e);
    return res.status(status).json({ message: e.message || 'Server error' });
  }
};
