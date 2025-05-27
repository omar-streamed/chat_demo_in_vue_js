// composables/useAuth.ts
import { useRouter } from 'vue-router'

export function useAuthCheck() {
  const router = useRouter()
  const username = localStorage.getItem('username')
  const email = localStorage.getItem('email')

  if (!username || !email) {
    router.push('/login')
  }
}
