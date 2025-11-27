import axios from 'axios'

export const API_BASE_URL = 'http://127.0.0.1:8000'

const api = axios.create({ baseURL: `${API_BASE_URL}/api`, headers: { 'Content-Type': 'application/json' } })

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

const clearAuthStorage = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth:logout'))
  }
}

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('accessToken')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
}, e => Promise.reject(e))

api.interceptors.response.use(res => res, err => {
  const originalRequest = err.config
  if (!originalRequest) return Promise.reject(err)
  
  // Don't intercept login/register requests
  if (originalRequest.url?.includes('/token/') || originalRequest.url?.includes('/auth/users/')) {
    return Promise.reject(err)
  }
  
  if (err.response && err.response.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      })
    }
    isRefreshing = true
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      clearAuthStorage()
      return Promise.reject(err)
    }
    return new Promise((resolve, reject) => {
      axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, { refresh: refreshToken })
        .then(({ data }) => {
          const newToken = data.access
          if (newToken) localStorage.setItem('accessToken', newToken)
          if (data.refresh) localStorage.setItem('refreshToken', data.refresh)
          processQueue(null, newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          resolve(api(originalRequest))
        })
        .catch(e => {
          processQueue(e, null)
          clearAuthStorage()
          reject(e)
        })
        .finally(() => { isRefreshing = false })
    })
  }
  return Promise.reject(err)
})

export default api
