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
  },
  evaluations: {
    list: '/evaluation/student',
    byCourse: (courseCode: string) => `/evaluation/course/${courseCode}`,
    update: (id: number | string) => `/evaluation/update/${id}`,
    delete: (id: number | string) => `/evaluation/delete/${id}`,
  },
  questions: {
    list: '/question',
    byEvaluation: (id: number | string) => `/question/evaluation/${id}`,
  },
  choices: {
    list: '/choice',
    byQuestion: (id: number | string) => `/choice/question/${id}`,
  },
  notifications: {
    list: '/notification',
  },
  responseSheet: {
    list: '/responseSheet',
    byStudentAndEval: (matricule: string, evaluationId: number | string) => `/responseSheet/${matricule}/${evaluationId}`,
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
