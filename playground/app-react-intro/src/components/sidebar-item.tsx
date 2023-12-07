type SidebarItemProps = {
  id: string,
  to: string,
  title: string,
  toc: string,
  type: 'link' | undefined,
};

function SidebarItem({
  id, type, title = '首页', toc = '', to = '/',
}: SidebarItemProps) {
  const linkClassName = ['nav-link', 'sidebar-item'];
  if (type === 'link') {
    linkClassName.push('active router-link-exact-active');
  }
  return (
    <>
      <li id={`sidebar-${id}`}>
        <a
          className={linkClassName.join(' ')}
          href={to}
        >
          { title }
        </a>
      </li>
      {
        // eslint-disable-next-line
      }<div dangerouslySetInnerHTML={{ __html: toc }} />
    </>
  );
}

SidebarItem.defaultProps = {
};

export default SidebarItem;
