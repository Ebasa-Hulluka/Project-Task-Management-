import React from "react";
import { LuCircleCheck, LuUsers, LuChartBar, LuCheck } from "react-icons/lu";

const Features = () => {
  const features = [
    {
      icon: <LuCircleCheck className="text-4xl text-primary" />,
      title: "Task Management",
      description: "Create, assign, and track tasks easily.",
      points: [
        "Create tasks with priorities",
        "Assign to team members",
        "Set deadlines and reminders",
        "Track progress in real-time",
      ],
    },
    {
      icon: <LuUsers className="text-4xl text-[#194f87]" />,
      title: "Team Collaboration",
      description: "Work together in real-time.",
      points: [
        "Team chat and comments",
        "File sharing",
        "@mentions and notifications",
        "Activity feed",
      ],
    },
    {
      icon: <LuChartBar className="text-4xl text-[#194f87]" />,
      title: "Progress Analytics",
      description: "Track performance with charts.",
      points: [
        "Visual progress tracking",
        "Performance metrics",
        "Burndown charts",
        "Custom reports",
      ],
    },
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for Modern Teams
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage tasks and projects effectively
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
            >
              <div className="bg-primary/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>

              <p className="text-gray-600 mb-6">{feature.description}</p>

              <ul className="space-y-3">
                {feature.points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <LuCheck className="text-primary mt-0.5 shrink-0" />
                    <span className="text-gray-600">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Second Features Row - Exactly as in the design */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-10">
            Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <LuCircleCheck className="text-2xl text-primary" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Task Management</h4>
              <p className="text-gray-600">
                Create, assign, and track tasks easily.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <LuUsers className="text-2xl text-[#194f87]" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Team Collaboration</h4>
              <p className="text-gray-600">Work together in real-time.</p>
            </div>

            <div className="text-center p-6">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <LuChartBar className="text-2xl text-[#194f87]" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Progress Analytics</h4>
              <p className="text-gray-600">Track performance with charts.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;


