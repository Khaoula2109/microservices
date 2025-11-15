import { Bus, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Bus className="h-6 w-6 text-mustard-500" />
              <span className="font-bold text-lg">TransportCity</span>
            </div>
            <p className="text-navy-200 text-sm">
              Votre solution de transport urbain moderne et fiable.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-mustard-500 mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-navy-200">
              <li className="hover:text-mustard-500 cursor-pointer transition-colors">Horaires</li>
              <li className="hover:text-mustard-500 cursor-pointer transition-colors">Acheter Tickets</li>
              <li className="hover:text-mustard-500 cursor-pointer transition-colors">Abonnements</li>
              <li className="hover:text-mustard-500 cursor-pointer transition-colors">Carte Live</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-mustard-500 mb-4">Aide</h3>
            <ul className="space-y-2 text-sm text-navy-200">
              <li className="hover:text-mustard-500 cursor-pointer transition-colors">FAQ</li>
              <li className="hover:text-mustard-500 cursor-pointer transition-colors">Contact</li>
              <li className="hover:text-mustard-500 cursor-pointer transition-colors">Conditions</li>
              <li className="hover:text-mustard-500 cursor-pointer transition-colors">Confidentialité</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-mustard-500 mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-navy-200">
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+33 1 23 45 67 89</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>contact@transportcity.fr</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Paris, France</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-800 mt-8 pt-8 text-center text-sm text-navy-300">
          <p>&copy; {new Date().getFullYear()} TransportCity. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
