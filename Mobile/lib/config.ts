export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

export const ENDPOINTS = {
  auth: {
    register: '/student/register',
    login: '/student/login',
    loginWithCard: '/student/login/card',
    verifyEmail: '/student/verify-email',
  },
  classes: {
    list: '/class',
  },
  courses: {
    list: '/course',
    byCode: (code: string) => `/course/${code}`,
    byStudent: '/course/student',
    byClass: (classId: number | string) => `/course/class/${classId}`,
  },
  evaluations: {
    // Returns evaluations for the logged-in student.
    // Each evaluation includes embedded questions and choices (deprecated question/choice endpoints removed from use).
    list: '/evaluation/student',
    // Start an evaluation session → returns { responseSheetId }
    start: (evaluationId: string) => `/evaluation/${evaluationId}/start`,
    // Save partial answers for a given response sheet id
    saveAnswers: (responseSheetId: number | string) => `/evaluation/response/${responseSheetId}/answers`,
    // Submit final answers for a given response sheet id
    submit: (responseSheetId: number | string) => `/evaluation/response/${responseSheetId}/submit`,
    revision: '/evaluation/student/revision',
    byCourse: (courseCode: string) => `/evaluation/course/${courseCode}`,
    update: (id: number | string) => `/evaluation/update/${id}`,
    delete: (id: number | string) => `/evaluation/delete/${id}`,
  },
  notifications: {
    list: '/notification',
  },
  responseSheet: {
    list: '/responseSheet',
    byStudentAndEval: (matricule: string, evaluationId: number | string) => `/responseSheet/${matricule}/${evaluationId}`,
    byCourseForStudent: (courseCode: string) => `/responseSheet/course/${courseCode}`,
  },
  answers: {
    list: '/answer',
    byResponseSheet: (id: number | string) => `/answer/responseSheet/${id}`,
    update: (id: number | string) => `/answer/update/${id}`,
  },
  deviceToken: {
    register: '/device-token/register',
    unregister: '/device-token/unregister',
    myTokens: '/device-token/my-tokens',
    updateLastUsed: '/device-token/update-last-used',
  },
  offline: {
    save: '/offline/save',
    sync: (id: number | string) => `/offline/sync/${id}`,
    syncAll: '/offline/sync-all',
    pending: '/offline/pending', // evaluationId as query param
    submit: (id: number | string) => `/offline/submit/${id}`,
  },
};
