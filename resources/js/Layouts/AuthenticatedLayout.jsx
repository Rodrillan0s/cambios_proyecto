import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children, fluid = false }) {
    const user = usePage().props.auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-100 flex relative overflow-x-hidden">
            {/* Backdrop overlay for mobile */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <div className={`fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0 transition-transform duration-300 transform shrink-0 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <Sidebar user={user} onClose={() => setSidebarOpen(false)} />
            </div>

            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* TOP BAR */}
                <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0">

                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                        <button 
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl mr-1 shrink-0"
                            title="Abrir menú"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="text-sm font-semibold text-gray-700 truncate max-w-[160px] sm:max-w-none">
                            {header}
                        </div>
                    </div>

                    <Dropdown>
                        <Dropdown.Trigger>
                            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm truncate max-w-[120px] sm:max-w-none">
                                {user.name}
                            </button>
                        </Dropdown.Trigger>

                        <Dropdown.Content>
                            <Dropdown.Link href={route('profile.edit')}>
                                Profile
                            </Dropdown.Link>

                            <Dropdown.Link method="post" href={route('logout')} as="button">
                                Log Out
                            </Dropdown.Link>
                        </Dropdown.Content>
                    </Dropdown>

                </header>

                {/* CONTENT */}
                <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
                    <div className={fluid ? "w-full" : "max-w-7xl mx-auto"}>
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
                            {children}
                        </div>
                    </div>
                </main>

            </div>
        </div>
    );
}