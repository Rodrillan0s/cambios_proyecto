import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;

    return (
        <div className="min-h-screen bg-gray-100 flex">

            {/* SIDEBAR */}
            <Sidebar user={user} />

            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col">

                {/* TOP BAR */}
                <header className="h-16 bg-white border-b flex items-center justify-between px-6">

                    <div className="text-sm font-semibold text-gray-700">
                        {header}
                    </div>

                    <Dropdown>
                        <Dropdown.Trigger>
                            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm">
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
                <main className="flex-1 p-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            {children}
                        </div>
                    </div>
                </main>

            </div>
        </div>
    );
}