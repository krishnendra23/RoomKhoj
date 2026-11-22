import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search } from 'lucide-react';
import Seo from '../components/common/Seo';
import PropertyCard from '../components/property/PropertyCard';
import { PropertyCardSkeleton } from '../components/common/Skeletons';
import { favouriteApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function FavouritesPage() {
  const { favouriteIds } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    favouriteApi
      .getAll()
      .then((res) => {
        if (active) setItems(res.data?.favourites || []);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [favouriteIds.size]);

  return (
    <div className="min-h-[75vh] bg-[#F8FAFC] py-10">
      <Seo title="Saved Rooms" description="Your saved favourite rental rooms on RoomKhoj." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2.5">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            Saved Favourite Rooms
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Shortlisted properties you saved to compare and contact owners directly.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <PropertyCardSkeleton key={idx} />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((fav, idx) => (
              <PropertyCard key={fav.property.id} property={fav.property} index={idx} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-slate-200/80 p-12 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-[#0F172A]">No saved rooms yet</h2>
            <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
              Tap the heart icon on any room listing to shortlist it here for easy comparison.
            </p>
            <Link
              to="/rooms"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold"
            >
              <Search className="w-4 h-4" />
              Find Rooms in Prayagraj
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
