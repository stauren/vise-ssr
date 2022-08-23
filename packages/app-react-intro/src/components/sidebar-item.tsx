type SidebarItemProps = {
  id: string,
  to: string,
  title: string,
  type: 'link' | undefined,
  toc: string,
};

function SidebarItem({ id, type, title = '首页', toc = '', to = '/' }: SidebarItemProps) {
  const linkClassName = ['nav-link', 'sidebar-item'];
  if (type === 'link') {
    linkClassName.push('active router-link-exact-active');
  }
  return (
    <>
      <li id={`sidebar-${id}`}>
        <a
          className={linkClassName.join(' ')}
          active-class="active"
          href={ to }
        >
          { title }
        </a>
      </li>
      <div dangerouslySetInnerHTML={{ __html: toc }} />
    </>
  );
}

SidebarItem.defaultProps = {
  id: '',
  to: '/',
  title: '首页',
  toc: '',
};

export default SidebarItem;
