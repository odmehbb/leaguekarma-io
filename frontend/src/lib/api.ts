import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

// Auth
export const getMe = () => api.get('/auth/me').then((r) => r.data)
export const logout = () => api.post('/auth/logout').then((r) => r.data)
export const linkRiot = (gameName: string, tagLine: string) =>
  api.post('/auth/link-riot', { gameName, tagLine }).then((r) => r.data)

// Player
export const getPlayerProfile = (gameName: string, tagLine: string) =>
  api.get(`/player/${gameName}/${tagLine}`).then((r) => r.data)
export const getPlayerMatches = (gameName: string, tagLine: string) =>
  api.get(`/player/${gameName}/${tagLine}/matches`).then((r) => r.data)
export const getSharedMatches = (gameName: string, tagLine: string) =>
  api.get(`/player/${gameName}/${tagLine}/shared-matches`).then((r) => r.data)

// Reviews
export const getMyReviews = (gameName: string, tagLine: string) =>
  api.get(`/player/${gameName}/${tagLine}/my-reviews`).then((r) => r.data)
export const submitReview = (
  gameName: string,
  tagLine: string,
  body: { matchId: string; tags: string[]; note?: string }
) => api.post(`/player/${gameName}/${tagLine}/reviews`, body).then((r) => r.data)
export const submitReviewByPuuid = (body: {
  subjectPuuid: string
  matchId: string
  tags: string[]
  note?: string
}) => api.post('/player/reviews/by-puuid', body).then((r) => r.data)
export const getMyMatchReviews = (matchId: string) =>
  api.get(`/player/reviews/my-match-reviews/${matchId}`).then((r) => r.data)

// Match
export const getMatchParticipants = (riotMatchId: string) =>
  api.get(`/match/${riotMatchId}/participants`).then((r) => r.data)

// Rankings
export const getRankings = () => api.get('/rankings').then((r) => r.data)
