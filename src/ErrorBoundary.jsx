import React from 'react';
import { Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    // Clear any potentially corrupt data
    try {
      // In case there's localStorage data from old versions
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('poker') || key.includes('tournament')) {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.error('Error removing localStorage key:', key, e);
          }
        }
      });
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
    
    // Reset error state
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Ops! Algo deu errado
              </h1>
              <p className="text-gray-600 mb-6">
                A aplicação encontrou um erro. Isso pode acontecer se houver dados incompatíveis de versões anteriores.
              </p>
            </div>

            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-red-800 mb-2">Detalhes do erro:</p>
              <pre className="text-xs text-red-700 overflow-auto max-h-32">
                {this.state.error && this.state.error.toString()}
              </pre>
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Home size={24} />
                Limpar Dados e Recarregar
              </button>

              <p className="text-sm text-gray-600 text-center">
                Este botão irá limpar dados locais antigos e recarregar a aplicação.
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2">O que aconteceu?</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Pode haver dados de versões antigas da aplicação</li>
                <li>Algum componente encontrou um erro durante a renderização</li>
                <li>Limpar os dados locais deve resolver o problema</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
