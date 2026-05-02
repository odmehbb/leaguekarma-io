import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMe, logout as apiLogout } from '../lib/api'

export function useAuth() {
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    retry: false,
  })

  const login = () => {
    window.location.href = '/api/auth/google'
  }

  const logout = async () => {
    await apiLogout()
    queryClient.clear()
    window.location.href = '/'
  }

  return { user: user ?? null, isLoading, login, logout }
}
