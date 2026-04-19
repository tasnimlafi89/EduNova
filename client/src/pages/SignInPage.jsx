import React from 'react';
import { SignIn } from '@clerk/clerk-react';

export const SignInPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 nebula-mesh opacity-20" />
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-container/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary-container/10 rounded-full blur-[120px]" />
      
      <div className="relative z-10 animate-cosmic-fade">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
            <span className="text-3xl font-bold text-white tracking-widest font-headline">EduNova</span>
          </div>
          <p className="text-on-surface-variant">Sign in to continue your learning journey</p>
        </div>
        <SignIn 
          routing="path" 
          path="/sign-in" 
          signUpUrl="/sign-up"
          afterSignInUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-surface-container border border-outline-variant/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]',
              headerTitle: 'text-white font-headline',
              headerSubtitle: 'text-on-surface-variant',
              socialButtonsBlockButton: 'bg-surface-container-high border-outline-variant/20 text-on-surface hover:bg-surface-container-highest',
              formFieldLabel: 'text-on-surface-variant',
              formFieldInput: 'bg-surface-container-highest border-outline-variant/20 text-on-surface',
              formButtonPrimary: 'bg-gradient-to-r from-primary to-primary-container hover:shadow-[0_0_25px_rgba(138,43,226,0.6)]',
              footerActionLink: 'text-primary hover:text-primary-fixed',
              identityPreviewEditButton: 'text-primary',
              formFieldAction: 'text-primary',
              dividerLine: 'bg-outline-variant/20',
              dividerText: 'text-on-surface-variant',
            }
          }}
        />
      </div>
    </div>
  );
};
