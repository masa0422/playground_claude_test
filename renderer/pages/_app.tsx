import { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useState, useEffect, Component, ReactNode } from 'react';
import { useThemeStore } from '../store/theme';
import { Alert, AlertTitle, Box, Button, Typography, Snackbar } from '@mui/material';
import '../styles/globals.css';
import '../styles/mdeditor.css';

// Error logging utility
const logError = (error: Error, context: string): void => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    message: error.message,
    stack: error.stack,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown'
  };
  
  console.error('Frontend Error:', errorInfo);
  
  // Send to Electron main process if available
  if (typeof window !== 'undefined' && window.electronAPI) {
    window.electronAPI.logError?.(errorInfo);
  }
};

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({
      hasError: true,
      error,
      errorInfo
    });
    
    logError(error, 'React Error Boundary');
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 3,
            backgroundColor: '#f5f5f5'
          }}
        >
          <Alert severity="error" sx={{ mb: 2, maxWidth: 600 }}>
            <AlertTitle>アプリケーションエラーが発生しました</AlertTitle>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {this.state.error?.message || 'Unknown error occurred'}
            </Typography>
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button variant="contained" onClick={this.handleRetry}>
              再試行
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => window.location.reload()}
            >
              アプリケーションを再読み込み
            </Button>
          </Box>
          
          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ mt: 4, p: 2, backgroundColor: '#fff', borderRadius: 1, maxWidth: 800 }}>
              <Typography variant="h6" gutterBottom>
                デバッグ情報:
              </Typography>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {this.state.error?.stack}
              </pre>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

// Global Error Handler Hook
const useGlobalErrorHandler = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logError(event.error, 'Global Error Handler');
      setError(event.error?.message || 'Unknown error occurred');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      logError(error, 'Unhandled Promise Rejection');
      setError(error.message);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const clearError = () => setError(null);

  return { error, clearError };
};

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error && typeof error === 'object' && 'status' in error) {
            const status = (error as any).status;
            if (status >= 400 && status < 500) {
              return false;
            }
          }
          return failureCount < 3;
        },
        onError: (error) => {
          logError(error as Error, 'React Query Error');
        }
      },
      mutations: {
        onError: (error) => {
          logError(error as Error, 'React Query Mutation Error');
        }
      }
    }
  }));
  
  const { isDark } = useThemeStore();
  const { error, clearError } = useGlobalErrorHandler();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        window.electronAPI.onMenuAction((action: string) => {
          console.log('Menu action received:', action);
          // Handle menu actions here
        });
      } catch (error) {
        logError(error as Error, 'Electron API Setup');
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
          <CssBaseline />
          <Component {...pageProps} />
          
          {/* Global Error Snackbar */}
          <Snackbar
            open={!!error}
            autoHideDuration={10000}
            onClose={clearError}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert 
              severity="error" 
              onClose={clearError}
              sx={{ width: '100%' }}
            >
              <AlertTitle>エラー</AlertTitle>
              {error}
            </Alert>
          </Snackbar>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default MyApp;