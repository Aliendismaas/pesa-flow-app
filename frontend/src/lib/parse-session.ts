import UAParser from "ua-parser-js";
import { format, formatDistanceToNowStrict, isPast, isValid } from "date-fns";
import { Smartphone, Laptop, Tablet, Monitor, LucideIcon } from "lucide-react";

interface SessionInfo {
  deviceType: string;
  browser: string;
  os: string;
  timeAgo: string;
  icon: LucideIcon;
}

export const parseSession = (
  userAgent: string,
  createdAt: string
): SessionInfo => {
  const parser = new UAParser(userAgent || "");
  const result = parser.getResult();

  const rawType = (result.device.type || "").toLowerCase();
  let deviceType = "Desktop";
  let icon: LucideIcon = Laptop;

  if (rawType === "mobile") {
    deviceType = "Mobile";
    icon = Smartphone;
  } else if (rawType === "tablet") {
    deviceType = "Tablet";
    icon = Tablet;
  } else if (result.os.name?.toLowerCase().includes("windows") || result.os.name?.toLowerCase().includes("mac")) {
    deviceType = "Desktop";
    icon = Laptop;
  } else {
    deviceType = "Computer";
    icon = Monitor;
  }

  const browserName = result.browser.name || "Web Browser";
  const browserVersion = result.browser.major ? ` ${result.browser.major}` : "";
  const browser = `${browserName}${browserVersion}`;

  const osName = result.os.name || "Operating System";
  const osVersion = result.os.version ? ` ${result.os.version}` : "";
  const os = `${osName}${osVersion}`;

  let timeAgo = "Active";
  try {
    const dateObj = new Date(createdAt);
    if (isValid(dateObj)) {
      timeAgo = isPast(dateObj)
        ? `${formatDistanceToNowStrict(dateObj)} ago`
        : format(dateObj, "d MMM, yyyy");
    }
  } catch {
    timeAgo = "Recently";
  }

  return {
    deviceType,
    browser,
    os,
    timeAgo,
    icon,
  };
};

