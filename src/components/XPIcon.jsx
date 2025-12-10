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
    XCircle
} from 'lucide-react';

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
    "network": Wifi,
    "alert_error": XCircle,
    "alert_info": Info,
    "alert_warning": AlertCircle
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
    "alert_warning": "#FBC02D"
};

const XPIcon = ({ name, size = 32, className, color }) => {
    const IconComponent = IconMap[name] || FileText; // Default to FileText
    const defaultColor = IconColors[name] || color || "currentColor";

    return <IconComponent size={size} className={className} color={defaultColor} />;
};

export default XPIcon;
