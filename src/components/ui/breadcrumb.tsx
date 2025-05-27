"use client";

import Link from "next/link";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  homeHref?: string;
  separator?: React.ReactNode;
  className?: string;
}

export const Breadcrumb = ({
  items,
  showHome = true,
  homeHref = "/dashboard",
  separator = <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />,
  className = "",
}: BreadcrumbProps) => {
  const allItems = showHome 
    ? [{ label: "首页", href: homeHref, icon: <HomeIcon className="h-4 w-4" />, current: false }, ...items]
    : items;

  return (
    <nav aria-label="面包屑导航" className={`flex items-center space-x-1 ${className}`}>
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;
        const isCurrent = item.current || isLast;

        return (
          <div key={index} className="flex items-center">
            {index > 0 && (
              <div className="mx-2">
                {separator}
              </div>
            )}
            
            {isCurrent ? (
              <span 
                className="flex items-center space-x-1 text-sm font-medium text-foreground"
                aria-current="page"
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </span>
            ) : (
              <Link
                href={item.href || "#"}
                className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}; 