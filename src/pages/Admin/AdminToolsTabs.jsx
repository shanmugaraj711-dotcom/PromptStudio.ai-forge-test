import FounderTools from './FounderTools';
import SupportInbox from './SupportInbox';
export default function AdminToolsTabs({api,tab}){if(tab==='users')return <FounderTools api={api}/>;if(tab==='support')return <SupportInbox api={api}/>;return null;}
