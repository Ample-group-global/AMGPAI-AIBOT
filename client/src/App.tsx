import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { PAIBotWidget } from "./components/PAIBotWidget";
import Result from "./pages/Result";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      {/* Landing page */}
      <Route path={"/"} component={Home} />
      {/* Assessment chatbot */}
      <Route path={"/assessment"} component={AssessmentPage} />
      {/* Results page */}
      <Route path={"/result/:sessionId"} component={Result} />
      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AssessmentPage() {
  return (
    <PAIBotWidget
      onClose={() => {
        // Go back to home page
        window.location.href = '/';
      }}
      onComplete={(sessionId) => {
        console.log('Assessment completed:', sessionId);
      }}
    />
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
