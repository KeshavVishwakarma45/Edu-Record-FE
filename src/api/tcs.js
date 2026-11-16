const MOCK_TCS = [
  {
    _id: 'TC001',
    studentName: 'Aarav Sharma',
    admissionNo: 'ADM001',
    course: 'B.Com',
    academicYear: '2025-26',
    reasonForLeaving: 'Higher Studies',
    conduct: 'Good',
    status: 'draft',
    createdAt: '2026-11-10T10:00:00.000Z',
    history: [],
  },
  {
    _id: 'TC002',
    studentName: 'Priya Verma',
    admissionNo: 'ADM002',
    course: 'BBA',
    academicYear: '2025-26',
    reasonForLeaving: 'Family Relocation',
    conduct: 'Very Good',
    status: 'pending_approval',
    createdAt: '2026-11-11T10:00:00.000Z',
    history: [
      { action: 'Draft created', at: '2026-11-11T10:00:00.000Z' },
      { action: 'Submitted for approval', at: '2026-11-11T11:00:00.000Z' },
    ],
  },
  {
    _id: 'TC003',
    studentName: 'Rahul Patel',
    admissionNo: 'ADM003',
    course: 'BCA',
    academicYear: '2025-26',
    reasonForLeaving: 'Personal Reasons',
    conduct: 'Excellent',
    status: 'approved',
    refNo: 'REF-1003',
    bookSerial: 'BOOK-1003',
    createdAt: '2026-11-12T10:00:00.000Z',
    history: [
      { action: 'Draft created', at: '2026-11-12T10:00:00.000Z' },
      { action: 'Submitted for approval', at: '2026-11-12T11:00:00.000Z' },
      { action: 'Approved', at: '2026-11-12T12:00:00.000Z' },
    ],
  },
  {
    _id: 'TC004',
    studentName: 'Neha Joshi',
    admissionNo: 'ADM004',
    course: 'B.Com',
    academicYear: '2025-26',
    reasonForLeaving: 'Course Completed',
    conduct: 'Good',
    status: 'rejected',
    rejectionRemark: 'Please verify student details.',
    createdAt: '2026-11-12T09:00:00.000Z',
    history: [
      { action: 'Draft created', at: '2026-11-12T09:00:00.000Z' },
      { action: 'Submitted for approval', at: '2026-11-12T10:00:00.000Z' },
      {
        action: 'Rejected',
        remark: 'Please verify student details.',
        at: '2026-11-12T11:00:00.000Z',
      },
    ],
  },
  {
    _id: 'TC005',
    studentName: 'Karan Singh',
    admissionNo: 'ADM005',
    course: 'BBA',
    academicYear: '2025-26',
    reasonForLeaving: 'Higher Studies',
    conduct: 'Very Good',
    status: 'issued',
    refNo: 'REF-1005',
    bookSerial: 'BOOK-1005',
    receivedBy: 'Parent',
    issuedAt: '2026-11-13T10:00:00.000Z',
    createdAt: '2026-11-10T09:00:00.000Z',
    history: [
      { action: 'Draft created', at: '2026-11-10T09:00:00.000Z' },
      { action: 'Submitted for approval', at: '2026-11-10T10:00:00.000Z' },
      { action: 'Approved', at: '2026-11-11T10:00:00.000Z' },
      { action: 'Issued', at: '2026-11-13T10:00:00.000Z' },
    ],
  },
];

const addHistory = (tc, action, remark = '') => {
  tc.history = [
    ...(tc.history || []),
    {
      action,
      remark,
      at: new Date().toISOString(),
    },
  ];
};

export const tcsApi = {
  async list({ page = 1, limit = 10, search = '', status = '', sort = '-createdAt' } = {}) {
    let records = [...MOCK_TCS];

    if (search) {
      const term = search.toLowerCase();

      records = records.filter((tc) =>
        [tc.studentName, tc.admissionNo, tc.course, tc._id].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(term),
        ),
      );
    }

    if (status) {
      records = records.filter((tc) => tc.status === status);
    }

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const direction = sort.startsWith('-') ? -1 : 1;

    records.sort((a, b) => {
      return (
        (new Date(a[sortField] || 0).getTime() - new Date(b[sortField] || 0).getTime()) * direction
      );
    });

    const total = records.length;
    const start = (page - 1) * limit;

    return {
      rows: records.slice(start, start + limit).map((tc) => ({ ...tc })),
      total,
    };
  },

  async create(payload) {
    const record = {
      ...payload,
      _id: `TC${Date.now()}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      history: [],
    };

    addHistory(record, 'Draft created');
    MOCK_TCS.unshift(record);

    return { ...record };
  },

  async update(id, payload) {
    const index = MOCK_TCS.findIndex((tc) => tc._id === id);

    if (index === -1) throw new Error('TC not found');
    if (MOCK_TCS[index].status !== 'draft') {
      throw new Error('Only draft TC can be edited');
    }

    MOCK_TCS[index] = {
      ...MOCK_TCS[index],
      reasonForLeaving: payload.reasonForLeaving,
      conduct: payload.conduct,
    };

    addHistory(MOCK_TCS[index], 'Draft updated');

    return { ...MOCK_TCS[index] };
  },

  async submit(id) {
    const index = MOCK_TCS.findIndex((tc) => tc._id === id);

    if (index === -1) throw new Error('TC not found');
    if (MOCK_TCS[index].status !== 'draft') {
      throw new Error('Only draft TC can be submitted');
    }

    MOCK_TCS[index].status = 'pending_approval';
    addHistory(MOCK_TCS[index], 'Submitted for approval');

    return { ...MOCK_TCS[index] };
  },

  async approve(id) {
    const index = MOCK_TCS.findIndex((tc) => tc._id === id);

    if (index === -1) throw new Error('TC not found');
    if (MOCK_TCS[index].status !== 'pending_approval') {
      throw new Error('Only pending TC can be approved');
    }

    MOCK_TCS[index] = {
      ...MOCK_TCS[index],
      status: 'approved',
      approvedAt: new Date().toISOString(),
      refNo: `REF-${Date.now()}`,
      bookSerial: `BOOK-${Date.now()}`,
    };

    addHistory(MOCK_TCS[index], 'Approved');

    return { ...MOCK_TCS[index] };
  },

  async reject(id, remark) {
    const index = MOCK_TCS.findIndex((tc) => tc._id === id);

    if (index === -1) throw new Error('TC not found');
    if (MOCK_TCS[index].status !== 'pending_approval') {
      throw new Error('Only pending TC can be rejected');
    }
    if (!remark?.trim()) {
      throw new Error('Rejection remark is required');
    }

    MOCK_TCS[index] = {
      ...MOCK_TCS[index],
      status: 'rejected',
      rejectionRemark: remark.trim(),
      rejectedAt: new Date().toISOString(),
    };

    addHistory(MOCK_TCS[index], 'Rejected', remark.trim());

    return { ...MOCK_TCS[index] };
  },

  async issue(id, payload) {
    const index = MOCK_TCS.findIndex((tc) => tc._id === id);

    if (index === -1) throw new Error('TC not found');
    if (MOCK_TCS[index].status !== 'approved') {
      throw new Error('Only approved TC can be issued');
    }
    if (!payload.receivedBy?.trim()) {
      throw new Error('Received By is required');
    }
    if (!payload.studentPhoto || !payload.studentSignature) {
      throw new Error('Student photo and signature are required');
    }

    MOCK_TCS[index] = {
      ...MOCK_TCS[index],
      status: 'issued',
      receivedBy: payload.receivedBy.trim(),
      studentPhoto: payload.studentPhoto.name,
      studentSignature: payload.studentSignature.name,
      issuedAt: new Date().toISOString(),
    };

    addHistory(MOCK_TCS[index], 'Issued');

    return { ...MOCK_TCS[index] };
  },

  async history(id) {
    const tc = MOCK_TCS.find((item) => item._id === id);

    if (!tc) throw new Error('TC not found');

    return [...(tc.history || [])];
  },
};
