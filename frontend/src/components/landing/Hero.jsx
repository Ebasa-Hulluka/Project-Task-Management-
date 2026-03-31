import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import landingPic from "../../pages/assets/images/landingPic.png";

const Hero = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeUsers: 0,
    completedTasks: 0,
    totalTeams: 0,
  });

  useEffect(() => {
    const fetchLandingStats = async () => {
      try {
        const response = await axiosInstance.get(
          API_PATHS.PUBLIC.GET_LANDING_STATS,
        );
        setStats(response.data);
      } catch (error) {
        console.error("Failed to load landing stats", error);
      }
    };

    fetchLandingStats();
  }, []);

  const formatCount = (value) => new Intl.NumberFormat().format(value || 0);

  return (
    <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#e8f4ef] via-white to-[#e8eef7]">
      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
              Manage Tasks & Projects
              <span className="block text-primary">Effortlessly with Debo</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-8">
              Organize, track, and collaborate all in one powerful task
              management platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate("/login")}
                className="bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#0c4634] transition-colors"
              >
                Login
              </button>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <img
              src={landingPic}
              alt="Debo landing"
              className="w-full max-w-2xl h-auto lg:scale-110 origin-center"
              style={{ animation: "heroFloat 6s ease-in-out infinite" }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-14">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {formatCount(stats.activeUsers)}
            </div>
            <div className="text-gray-600 mt-2">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#194f87]">
              {formatCount(stats.completedTasks)}
            </div>
            <div className="text-gray-600 mt-2">Tasks Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {formatCount(stats.totalTeams)}
            </div>
            <div className="text-gray-600 mt-2">Teams</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
