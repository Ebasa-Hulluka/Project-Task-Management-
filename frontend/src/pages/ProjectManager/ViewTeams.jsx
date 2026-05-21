import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { LuUsers, LuSearch } from "react-icons/lu";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import TeamCard from "../../components/Cards/TeamCard";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { getErrorMessage } from "../../utils/helper";

const ViewTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(API_PATHS.TEAMS.GET_ALL_TEAMS);
        setTeams(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        toast.error(getErrorMessage(error) || "Failed to load teams");
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const filteredTeams = teams.filter((team) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      team.name?.toLowerCase().includes(q) ||
      team.description?.toLowerCase().includes(q) ||
      team.members?.some(
        (m) =>
          m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q),
      )
    );
  });

  return (
    <DashboardLayout activeMenu="Teams">
      <div className="my-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-medium text-gray-900">Teams</h2>
            <p className="text-sm text-gray-500 mt-1">
              View available teams and their members (read-only)
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search teams or members..."
              className="input pl-10 w-full text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : filteredTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTeams.map((team) => (
              <TeamCard key={team._id} team={team} viewOnly />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
            <LuUsers className="text-5xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              {searchTerm ? "No teams match your search" : "No teams available"}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewTeams;
