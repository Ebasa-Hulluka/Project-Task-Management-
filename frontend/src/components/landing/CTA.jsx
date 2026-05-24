import React from "react";

const CTA = () => {
  return (
    <section
      id="about"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#194f87] to-primary"
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          About Debo Project Manager
        </h2>
        <p className="text-xl text-white/90 mb-8 leading-relaxed">
          Debo Project Manager is a comprehensive project and task management
          platform built to transform how teams organize work. We replace
          scattered Excel sheets, messy paper trails, and fragmented messaging
          apps with one powerful, centralized digital workspace.
        </p>
      </div>
    </section>
  );
};

export default CTA;
