import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { LuUserCheck, LuSearch, LuMail } from "react-icons/lu";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { getErrorMessage, getInitials } from "../../utils/helper";

const TesterCard = ({ user }) => {
  if (!user) return null;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start gap-4">
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt={user.name}
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-semibold shrink-0">
            {getInitials(user.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
          <p className="text-xs text-violet-600 font-medium mt-0.5">Tester</p>
          <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-2 truncate">
            <LuMail className="text-gray-400 shrink-0" />
            {user.email}
          </p>
          {user.team && typeof user.team === "object" && user.team.name && (
            <p className="text-xs text-gray-400 mt-2">
              Team: <span className="text-gray-600">{user.team.name}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const ViewTesters = () => {
  const [testers, setTesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchTesters = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(
          API_PATHS.USERS.GET_USERS_BY_ROLE("tester"),
        );
        setTesters(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        toast.error(getErrorMessage(error) || "Failed to load testers");
      } finally {
        setLoading(false);
      }
    };

    fetchTesters();
  }, []);

  const filteredTesters = testers.filter((user) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout activeMenu="Testers">
      <div className="my-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-medium text-gray-900">Testers</h2>
            <p className="text-sm text-gray-500 mt-1">
              View available testers for task assignments (read-only)
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search testers..."
              className="input pl-10 w-full text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : filteredTesters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTesters.map((tester) => (
              <TesterCard key={tester._id} user={tester} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
            <LuUserCheck className="text-5xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              {searchTerm ? "No testers match your search" : "No testers available"}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewTesters;
