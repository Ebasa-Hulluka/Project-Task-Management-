import React from "react";
import { LuUser } from "react-icons/lu";
import { getInitials } from "../utils/helper";

const AvatarGroup = ({
  users = [],
  avatars = [],
  names = [],
  maxVisible = 3,
  size = "md",
  showTooltip = false,
  onUserClick,
}) => {
  // Combine users and avatars data
  const items =
    users.length > 0
      ? users
      : avatars.map((url, index) => ({
          profileImageUrl: url,
          name: names[index] || `User ${index + 1}`,
        }));

  if (!items.length) return null;

  // Size classes
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
    xl: "w-12 h-12 text-lg",
  };

  const getContainerSize = () => {
    const base = sizeClasses[size] || sizeClasses.md;
    return base.split(" ").slice(0, 2).join(" ");
  };

  const visibleItems = items.slice(0, maxVisible);
  const remainingCount = items.length - maxVisible;

  const handleUserClick = (user, index) => {
    if (onUserClick) {
      onUserClick(user, index);
    }
  };

  return (
    <div className="flex items-center -space-x-2 rtl:space-x-reverse">
      {visibleItems.map((item, index) => (
        <div
          key={index}
          className={`relative ${getContainerSize()} rounded-full ring-2 ring-white hover:ring-primary hover:z-10 transition-all cursor-pointer group`}
          onClick={() => handleUserClick(item, index)}
          title={showTooltip ? item.name : undefined}
        >
          {item.profileImageUrl ? (
            <img
              src={item.profileImageUrl}
              alt={item.name}
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
                e.target.parentElement.classList.add("bg-primary/10");
              }}
            />
          ) : (
            <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {getInitials(item.name)}
              </span>
            </div>
          )}

          {/* Tooltip */}
          {showTooltip && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {item.name}
            </div>
          )}
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={`${getContainerSize()} rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors cursor-default`}
          title={`${remainingCount} more user${remainingCount > 1 ? "s" : ""}`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

// Avatar component for single user
export const Avatar = ({ user, size = "md", showName = false, onClick }) => {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
    xl: "w-12 h-12 text-lg",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`relative ${sizeClasses[size]} rounded-full overflow-hidden cursor-pointer group`}
        onClick={() => onClick?.(user)}
      >
        {user?.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt={user?.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {getInitials(user?.name)}
            </span>
          </div>
        )}
      </div>

      {showName && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user?.name}
          </p>
          {user?.email && (
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AvatarGroup;
