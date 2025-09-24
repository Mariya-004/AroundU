import React from "react";

export default function SplashScreen() {
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-200 min-h-screen flex flex-col items-center justify-center">
      <main className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-sm p-8 text-center">
          {/* Logo */}
          <div className="mb-8">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAICVhEO1PASk40osEgTDAz2QtRHVal4SJcFDzDEikjoM6JS5a_wXHcVfS2zubXQQtg47ALjCuIwuXjPdDQyxwvfCAHFidyf8Fvt5TDRLAefUuc-UbpTXZl2M7amUP9NLzTlhtx4H_L9OyggLUOAJqumqcNjbi9NJFQ7dRswnlFFftloM_zssAx7zs6DNujMbjtJrPCkF1S6eP5jmfUcF61lMfgdcTrr49ZdBPxEInWt1JKztgyePS_WVby4PZyMJIVJYUNhrgduQ_J"
              alt="AroundU Logo"
              className="mx-auto w-40 h-40"
            />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Shop Local. Live Better.
          </h1>
        </div>
      </main>
    </div>
  );
}
