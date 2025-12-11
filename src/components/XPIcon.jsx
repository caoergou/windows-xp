import React from 'react';
import {
    Monitor,
    Files,
    Trash2,
    Globe,
    FileText,
    Folder,
    FolderOpen,
    HardDrive,
    MessageCircle,
    FileCode,
    RefreshCw,
    Scissors,
    Plus,
    Link,
    Settings,
    User,
    LogOut,
    Power,
    AppWindow,
    LayoutGrid,
    Wifi,
    AlertCircle,
    Info,
    XCircle,
    Mail,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    Search,
    ChevronDown,
    Home,
    LayoutList,
    Star,
    History,
    Printer,
    X,
    Image
} from 'lucide-react';

const XPNetwork = ({ size, color = "currentColor", className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {/* Left Monitor */}
        <rect x="2" y="6" width="9" height="7" rx="1" />
        <path d="M6.5 13v2" />
        <path d="M3.5 15h6" />

        {/* Right Monitor */}
        <rect x="13" y="6" width="9" height="7" rx="1" />
        <path d="M17.5 13v2" />
        <path d="M14.5 15h6" />
    </svg>
);

const IconMap = {
    "computer": Monitor,
    "documents": Files,
    "recycle_bin": Trash2,
    "ie": Globe,
    "html": FileCode,
    "folder": Folder,
    "folder_open": FolderOpen,
    "file": FileText,
    "drive": HardDrive,
    "qq": MessageCircle, // Using MessageCircle as a generic chat icon for QQ
    "refresh": RefreshCw,
    "paste": Scissors, // Not exactly paste but close enough for now, or use generic
    "new_folder": Folder,
    "new_shortcut": Link,
    "properties": Settings,
    "user": User,
    "windows": LayoutGrid, // For start menu/windows logo
    "logout": LogOut,
    "shutdown": Power,
    "app_window": AppWindow,
    "network": XPNetwork, // Replaced Wifi with custom XPNetwork icon
    "alert_error": XCircle,
    "alert_info": Info,
    "alert_warning": AlertCircle,
    "email": Mail,
    "back": ArrowLeft,
    "forward": ArrowRight,
    "up": ArrowUp,
    "search": Search,
    "chevron_down": ChevronDown,
    "home": Home,
    "views": LayoutList,
    "favorites": Star,
    "history": History,
    "print": Printer,
    "stop": X,
    "image": Image
};

// Color mapping to make them look a bit more colorful/XP-like (optional)
const IconColors = {
    "computer": "#2c72c2",
    "documents": "#fbbd08",
    "recycle_bin": "#767676",
    "ie": "#1E90FF",
    "html": "#E34C26",
    "folder": "#fbbd08",
    "folder_open": "#fbbd08",
    "file": "#A0A0A0",
    "drive": "#808080",
    "qq": "#D52B2B",
    "windows": "#00CCFF",
    "alert_error": "#D32F2F",
    "alert_info": "#1976D2",
    "alert_warning": "#FBC02D",
    "back": "#4CAF50", // Just a distinct color for nav
    "forward": "#4CAF50"
};

const XPIcon = ({ name, size = 32, className, color }) => {
    const IconComponent = IconMap[name] || FileText; // Default to FileText
    const defaultColor = IconColors[name] || color || "currentColor";

    return <IconComponent size={size} className={className} color={defaultColor} />;
};

export default XPIcon;
