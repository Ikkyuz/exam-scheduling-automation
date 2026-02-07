import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-100 via-indigo-200 to-purple-200">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e0e0e02e_1px,transparent_1px),linear-gradient(to_bottom,#e0e0e02e_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -100, 0],
          y: [0, 100, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50"
      />
      <motion.div
        animate={{
          scale: [1, 1.4, 1],
          x: [0, 50, 0],
          y: [0, -100, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50"
      />
      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
          className="absolute w-1 h-1 bg-gray-300 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
      {/* Content container */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="pt-12 pb-8 px-4"
        >
          <div className="text-center">
            {/* Logo/Brand */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2,
              }}
              className="inline-flex items-center justify-center mb-6"
            >
              <div className="relative">
                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 rounded-2xl blur-xl opacity-70"
                />
                <div className="relative bg-gradient-to-br from-indigo-100 to-purple-100 p-4 rounded-2xl shadow-2xl">
                  <Sparkles className="h-12 w-12 text-indigo-600" />
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-5xl md:text-6xl lg:text-7xl font-black mb-4"
            >
              <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                ExamScheduling
              </span>
              <span className="text-gray-800"> AI</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-50/70 backdrop-blur-sm rounded-full border border-indigo-300"
            >
              <span className="text-lg text-gray-700 font-medium">
                ระบบจัดตารางสอบอัจฉริยะ
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center px-4 pb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="w-full max-w-6xl"
          >
            <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 md:p-12">
              {children}
            </div>
          </motion.div>
        </div>

        {/* Footer decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="pb-8 flex justify-center gap-2"
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full"
            />
          ))}
        </motion.div>
      </div>{" "}
    </div>
  );
};

export default AuthLayout;
