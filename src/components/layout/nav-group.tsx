import { ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip'
import { NavCollapsible, NavItem, NavLink, type NavGroup } from './types'

export function NavGroup({ title, items }: NavGroup) {
  const { state } = useSidebar()
  const href = useLocation({ select: (location) => location.href })
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const key = `${item.title}-${item.url}`

          if (!item.items)
            return <SidebarMenuLink key={key} item={item} href={href} />

          if (state === 'collapsed')
            return (
              <SidebarMenuCollapsedDropdown key={key} item={item} href={href} />
            )

          return <SidebarMenuCollapsible key={key} item={item} href={href} />
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

const NavBadge = ({ children }: { children: ReactNode }) => (
  <Badge className='rounded-full px-1 py-0 text-xs'>{children}</Badge>
)

const SidebarMenuLink = ({ item, href }: { item: NavLink; href: string }) => {
  const { setOpenMobile } = useSidebar()
  
  // For disabled items, we'll render a button with disabled styles instead of a Link
  if (item.disabled) {
    return (
      <SidebarMenuItem>
        <TooltipProvider delayDuration={50}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <SidebarMenuButton
                  className="text-muted-foreground cursor-not-allowed"
                >
                  {item.icon && <item.icon className="text-muted-foreground" />}
                  <span>{item.title}</span>
                  {item.badge && <NavBadge>{item.badge}</NavBadge>}
                  {item.rightIcon && <item.rightIcon className="ml-auto h-4 w-4 text-muted-foreground" />}
                </SidebarMenuButton>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.tooltip || "Coming Soon"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </SidebarMenuItem>
    )
  }
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={checkIsActive(href, item)}
        tooltip={item.tooltip || item.title}
      >
        <Link to={item.url} onClick={() => setOpenMobile(false)}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
          {item.rightIcon && <item.rightIcon className="ml-auto h-4 w-4" />}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

const SidebarMenuCollapsible = ({
  item,
  href,
}: {
  item: NavCollapsible
  href: string
}) => {
  const { setOpenMobile } = useSidebar()
  return (
    <Collapsible
      asChild
      defaultOpen={checkIsActive(href, item, true)}
      className='group/collapsible'
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.tooltip || item.title}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            {item.rightIcon && <item.rightIcon className="ml-auto mr-1 h-4 w-4" />}
            <ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className='CollapsibleContent'>
          <SidebarMenuSub>
            {item.items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                {subItem.disabled ? (
                  <TooltipProvider delayDuration={50}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <SidebarMenuSubButton className="text-muted-foreground cursor-not-allowed">
                            {subItem.icon && <subItem.icon className="text-muted-foreground" />}
                            <span>{subItem.title}</span>
                            {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                            {subItem.rightIcon && <subItem.rightIcon className="ml-auto h-4 w-4 text-muted-foreground" />}
                          </SidebarMenuSubButton>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{subItem.tooltip || "Coming Soon"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <SidebarMenuSubButton
                    asChild
                    isActive={checkIsActive(href, subItem)}
                  >
                    <Link to={subItem.url} onClick={() => setOpenMobile(false)}>
                      {subItem.icon && <subItem.icon />}
                      <span>{subItem.title}</span>
                      {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                      {subItem.rightIcon && <subItem.rightIcon className="ml-auto h-4 w-4" />}
                    </Link>
                  </SidebarMenuSubButton>
                )}
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

const SidebarMenuCollapsedDropdown = ({
  item,
  href,
}: {
  item: NavCollapsible
  href: string
}) => {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={item.tooltip || item.title}
            isActive={checkIsActive(href, item)}
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            {item.rightIcon && <item.rightIcon className="ml-auto mr-1 h-4 w-4" />}
            <ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={4}>
          <DropdownMenuLabel>
            {item.title} {item.badge ? `(${item.badge})` : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub) => (
            <DropdownMenuItem 
              key={`${sub.title}-${sub.url}`} 
              asChild={!sub.disabled}
              disabled={sub.disabled}
              className={sub.disabled ? "text-muted-foreground cursor-not-allowed" : ""}
            >
              {sub.disabled ? (
                <TooltipProvider delayDuration={50}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center w-full">
                        {sub.icon && <sub.icon className="mr-2 text-muted-foreground" />}
                        <span className='max-w-52 text-wrap'>{sub.title}</span>
                        {sub.badge && <span className='ml-auto text-xs'>{sub.badge}</span>}
                        {sub.rightIcon && <sub.rightIcon className="ml-auto h-4 w-4 text-muted-foreground" />}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{sub.tooltip || "Coming Soon"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Link
                  to={sub.url}
                  className={`${checkIsActive(href, sub) ? 'bg-secondary' : ''}`}
                >
                  {sub.icon && <sub.icon />}
                  <span className='max-w-52 text-wrap'>{sub.title}</span>
                  {sub.badge && <span className='ml-auto text-xs'>{sub.badge}</span>}
                  {sub.rightIcon && <sub.rightIcon className="ml-auto h-4 w-4" />}
                </Link>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function checkIsActive(href: string, item: NavItem, mainNav = false) {
  return (
    href === item.url || // /endpint?search=param
    href.split('?')[0] === item.url || // endpoint
    !!item?.items?.filter((i) => i.url === href).length || // if child nav is active
    (mainNav &&
      href.split('/')[1] !== '' &&
      href.split('/')[1] === item?.url?.split('/')[1])
  )
}
