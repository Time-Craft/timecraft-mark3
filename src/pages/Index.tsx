
import { motion } from "framer-motion";

const Index = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen flex items-center justify-center bg-white"
    >
      <div className="text-center space-y-6 px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="space-y-2"
        >
          <span className="px-3 py-1 text-xs tracking-wider uppercase bg-neutral-100 rounded-full">
            Welcome
          </span>
          <h1 className="text-4xl font-light tracking-tight sm:text-5xl mt-4">
            Ready to Begin
          </h1>
        </motion.div>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-neutral-600 max-w-lg mx-auto"
        >
          Connect your GitHub account to start building something extraordinary.
        </motion.p>
      </div>
    </motion.div>
  );
};

export default Index;
