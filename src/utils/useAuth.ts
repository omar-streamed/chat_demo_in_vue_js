// composables/useAuth.ts
import { useRouter } from 'vue-router'

export function useAuthCheck() {
  const router = useRouter()
  const username = localStorage.getItem('user')


  if (!username) {
    router.push('/login')
  }
}
