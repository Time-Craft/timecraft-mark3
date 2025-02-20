
import React, { useEffect, useState, Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { supabase } from "./integrations/supabase/client"
import MainNav from "./components/MainNav"
import Login from "./pages/Login" // Import Login directly

// Lazy load other route components
const Home = React.lazy(() => import("./pages/Home"))
const Explore = React.lazy(() => import("./pages/Explore"))
const Offer = React.lazy(() => import("./pages/Offer"))
const Profile = React.lazy(() => import("./pages/Profile"))
const Onboarding = React.lazy(() => import("./pages/Onboarding"))
const Challenges = React.lazy(() => import("./pages/Challenges"))
const NotFound = React.lazy(() => import("./pages/NotFound"))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    },
  },
})

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-cream">
    <div className="text-navy animate-pulse">Loading...</div>
  </div>
)

const App = () => {
  const [session, setSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)
  const [authInitialized, setAuthInitialized] = useState(false)

  const checkUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .maybeSingle()
      
      if (error) throw error
      
      if (!data) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{ id: userId }])
        
        if (insertError) throw insertError
        setIsNewUser(true)
      } else {
        setIsNewUser(!data.username)
      }
    } catch (error) {
      console.error('Error checking profile:', error)
      setIsNewUser(false)
    }
  }, [])

  const handleAuthChange = useCallback(async (event: string, newSession: any) => {
    console.log('Auth state changed:', event)

    switch (event) {
      case 'SIGNED_OUT':
      case 'USER_UPDATED':
        setSession(null)
        setIsNewUser(false)
        queryClient.clear()
        break

      case 'SIGNED_IN':
      case 'TOKEN_REFRESHED':
        // Only update if the session has actually changed
        if (newSession?.user?.id !== session?.user?.id) {
          setSession(newSession)
          if (newSession?.user) {
            await checkUserProfile(newSession.user.id)
          }
        }
        break

      case 'PASSWORD_RECOVERY':
        // Handle password recovery if needed
        break

      case 'INITIAL_SESSION':
        if (!authInitialized) {
          setAuthInitialized(true)
          if (newSession) {
            setSession(newSession)
            if (newSession.user) {
              await checkUserProfile(newSession.user.id)
            }
          }
        }
        break
    }
  }, [authInitialized, session?.user?.id, checkUserProfile])

  useEffect(() => {
    let mounted = true

    const initSession = async () => {
      if (!mounted || authInitialized) return

      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          if (mounted) {
            setSession(null)
            setIsLoading(false)
            setAuthInitialized(true)
          }
          return
        }

        if (mounted) {
          setAuthInitialized(true)
          setSession(currentSession)
          
          if (currentSession?.user) {
            await checkUserProfile(currentSession.user.id)
          }
        }
      } catch (error) {
        console.error('Session init error:', error)
        if (mounted) {
          setSession(null)
          setIsLoading(false)
          setAuthInitialized(true)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange)

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [authInitialized, handleAuthChange, checkUserProfile])

  if (isLoading) {
    return <LoadingFallback />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {session && <MainNav />}
          <Routes>
            {!session ? (
              <>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            ) : isNewUser ? (
              <>
                <Route path="/onboarding" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <Onboarding setIsNewUser={setIsNewUser} />
                  </Suspense>
                } />
                <Route path="*" element={<Navigate to="/onboarding" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <Home />
                  </Suspense>
                } />
                <Route path="/explore" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <Explore />
                  </Suspense>
                } />
                <Route path="/offer" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <Offer />
                  </Suspense>
                } />
                <Route path="/profile" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <Profile />
                  </Suspense>
                } />
                <Route path="/challenges" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <Challenges />
                  </Suspense>
                } />
                <Route path="/onboarding" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <Onboarding setIsNewUser={setIsNewUser} />
                  </Suspense>
                } />
                <Route path="*" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <NotFound />
                  </Suspense>
                } />
              </>
            )}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
