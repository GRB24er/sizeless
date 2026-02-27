import { DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import Link from "next/link";

export const NotificationsDropdown = () => (
  <DropdownMenuContent align="end" className="w-64">
    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      <NotificationItem title="Shipment #AML-X8K2M Delivered" time="2 hours ago" />
    </DropdownMenuItem>
    <DropdownMenuItem>
      <NotificationItem title="Shipment #AML-R4P7N In Transit" time="Yesterday" />
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      <Link href="/notifications" className="w-full text-center text-xs text-emerald-600">View All Notifications</Link>
    </DropdownMenuItem>
  </DropdownMenuContent>
);

const NotificationItem = ({ title, time }: { title: string; time: string }) => (
  <div className="flex flex-col">
    <span className="font-medium">{title}</span>
    <span className="text-xs text-gray-500">{time}</span>
  </div>
);
