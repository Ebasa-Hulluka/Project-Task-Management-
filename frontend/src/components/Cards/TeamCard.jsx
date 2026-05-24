import React, { useMemo, useState } from "react";
import {
  LuUsers,
  LuCrown,
  LuPencil,
  LuTrash2,
  LuUser,
  LuCheck,
} from "react-icons/lu";

import AvatarGroup from "../AvatarGroup";
import Modal from "../Modal";

const TeamCard = ({
  team,
  onClick,
  onEdit,
  onDelete,
  showActions = false,
  viewOnly = false,
}) => {
  const [showMembersModal, setShowMembersModal] = useState(false);

  const {
    _id,
    name,
    description,
    members = [],
    lead,
    projects = [],
    memberCount,
    projectCount,
    createdBy,
  } = team;
  const safeMemberCount =
    typeof memberCount === "number" ? memberCount : members.length;
  const safeProjectCount =
    typeof projectCount === "number" ? projectCount : projects.length;
  const leadId = useMemo(() => String(lead?._id || lead || ""), [lead]);

  if (!team) return null;

  const handleClick = () => {
    if (onClick) {
      onClick(_id);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(_id);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(_id);
    }
  };

  const handleOpenMembers = (e) => {
    e.stopPropagation();
    setShowMembersModal(true);
  };

  return (
    <>
      <div
        className={`bg-white rounded-xl p-5 shadow-sm border border-gray-100 transition-all ${
          viewOnly ? "" : "hover:shadow-md cursor-pointer"
        }`}
        onClick={viewOnly ? undefined : handleClick}
        role={viewOnly ? undefined : "button"}
      >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <LuUsers className="text-primary text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{name}</h3>
            <p className="text-xs text-gray-400">
              {safeMemberCount} member{safeMemberCount !== 1 ? "s" : ""}
            </p>
            {createdBy && (
              <p className="text-[10px] text-gray-500 mt-0.5">
                Created by: <span className="font-medium text-gray-700">{createdBy.name || (typeof createdBy === "string" ? createdBy : "System")}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-4">{description}</p>
      )}

      {/* Team Lead */}
      {lead && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <LuCrown className="text-amber-500" />
            Team Lead
          </p>
          <div className="flex items-center gap-2">
            {lead.profileImageUrl ? (
              <img
                src={lead.profileImageUrl}
                alt={lead.name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                <LuUser className="text-primary text-xs" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">{lead.name}</p>
              <p className="text-xs text-gray-400">{lead.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 p-2 rounded-lg">
          <p className="text-xs text-blue-600 mb-1">Projects</p>
          <p className="text-lg font-semibold text-blue-700">{safeProjectCount}</p>
        </div>
        <div className="bg-green-50 p-2 rounded-lg">
          <p className="text-xs text-green-600 mb-1">Members</p>
          <p className="text-lg font-semibold text-green-700">{safeMemberCount}</p>
        </div>
      </div>

      {/* Team Members */}
      {members.length > 0 && (
        <div
          className={`pt-3 border-t border-gray-100 ${viewOnly ? "" : "cursor-pointer"}`}
          onClick={viewOnly ? undefined : handleOpenMembers}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Team members</span>
            {!viewOnly && <span className="text-xs text-primary">View list</span>}
          </div>
          {viewOnly ? (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {members.map((member) => {
                const memberId = String(member?._id || member || "");
                const isLead = Boolean(leadId && memberId === leadId);
                return (
                  <div
                    key={memberId}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs border transition-all ${
                      isLead
                        ? "bg-amber-50 border-amber-200 text-amber-800"
                        : "bg-gray-50 border-gray-100 text-gray-600"
                    }`}
                    title={`${member?.name || "Unknown"} (${member?.email || "No email"})`}
                  >
                    {isLead && <LuCrown className="text-amber-500 text-[10px] shrink-0" />}
                    <span className="font-semibold text-gray-700">
                      {member?.name || "Unknown"}
                    </span>
                    {member?.email && (
                      <span className="text-[10px] text-gray-400 font-normal truncate max-w-[120px]">
                        {member.email}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <AvatarGroup users={members} maxVisible={5} size="sm" />
          )}
        </div>
      )}

      {viewOnly && members.length === 0 && (
        <p className="text-xs text-gray-400 pt-3 border-t border-gray-100 mt-3">
          No members in this team yet.
        </p>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={handleEdit}
            className="text-xs text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
          >
            <LuPencil className="text-xs" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="text-xs text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 transition-colors flex items-center gap-1"
          >
            <LuTrash2 className="text-xs" />
            Delete
          </button>
        </div>
      )}

      </div>

      <Modal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        title={`${name} Members`}
        size="sm"
      >
        {members.length > 0 ? (
          <div className="space-y-2">
            {members.map((member) => {
              const memberId = String(member?._id || member || "");
              const isLead = Boolean(leadId && memberId === leadId);
              return (
                <div
                  key={memberId}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {member?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {member?.email || "No email"}
                    </p>
                  </div>
                  {isLead && (
                    <div className="flex items-center gap-1 text-green-600 text-xs font-medium shrink-0">
                      <LuCheck className="text-sm" />
                      Leader
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No members found.</p>
        )}
      </Modal>
    </>
  );
};

export default TeamCard;
