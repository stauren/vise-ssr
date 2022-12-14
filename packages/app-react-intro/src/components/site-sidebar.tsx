import SidebarItem from '@/components/sidebar-item';
import SIDEBAR_ITEMS from '@/data/sidebar-items.json';

const sidebarItems = SIDEBAR_ITEMS.map((item) => ({
  id: item.id,
  to: item.to || `/${item.id}.html`,
  title: item.title,
  type: item.type,
  toc: '',
}));

export default function SiteSidebar() {
  return (
    <aside className="sidebar">
      <ul className="sidebar-links">
        <p className="sidebar-heading sidebar-item active">
          使用向导
        </p>
        <ul className="item-ctn">
          {
          sidebarItems.map((item) => (
            <SidebarItem
              id={item.id}
              key={item.to}
              type={item.type === 'link' ? 'link' : undefined}
              to={item.to}
              title={item.title}
              toc={item.toc}
            />
          ))
          }
        </ul>
      </ul>
    </aside>
  );
}
