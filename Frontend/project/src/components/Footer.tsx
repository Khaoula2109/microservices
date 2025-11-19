import { Bus } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Bus className="h-6 w-6 text-mustard-500" />
            <span className="font-bold text-lg">KowihanTransit</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
