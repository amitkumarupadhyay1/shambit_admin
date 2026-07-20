'use client';

import { Building2, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { HotelPartnerProperty } from '@/types/property';

interface Props {
  property: HotelPartnerProperty;
  onNext?: () => void;
}

export default function RoomDetailsStep({ property, onNext }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-black text-gray-900 tracking-tight mb-2">Property Overview</h2>
        <p className="text-sm text-gray-500 font-medium">A comprehensive view of the property and its mapped rooms.</p>
      </div>

      {/* Core Info */}
      <Card className="rounded-[24px] border-gray-200 overflow-hidden shadow-sm">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-base font-black uppercase tracking-tight">Property Intelligence</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Entity Type</p>
              <p className="text-sm font-bold text-gray-900">{property.property_type}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pricing Model</p>
              <p className="text-sm font-bold text-gray-900">
                {property.pricing_mode === 'A_LA_CARTE_MEAL' ? 'Price per person' : 'Room rate plans'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Star Rating</p>
              <p className="text-sm font-bold text-gray-900">{property.star_rating} Stars</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Inventory</p>
              <p className="text-sm font-bold text-gray-900">{property.total_rooms} Rooms</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Location</p>
              <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                <MapPin className="w-4 h-4 text-emerald-500" />
                {property.city_name}
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Narrative</p>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              {property.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Rooms List */}
      <div className="space-y-6">
        <h3 className="text-lg font-black text-gray-900">Rooms & Capacity Configuration</h3>
        {(property.room_types || []).map((room) => (
          <Card key={room.id} className="rounded-[24px] border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
              {/* Room Image Placeholder if no real media */}
              {room.image_urls?.[0] || room.photos?.[0]?.photo_url ? (
                <div 
                  className="w-full md:w-64 h-48 bg-gray-100 rounded-xl bg-cover bg-center border border-gray-200"
                  style={{ backgroundImage: `url(${room.image_urls?.[0] || room.photos?.[0]?.photo_url})` }}
                />
              ) : (
                <div className="w-full md:w-64 h-48 bg-gray-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Room Media</span>
                  <span className="text-[10px] font-medium text-gray-400 mt-1">Managed via Photos App</span>
                </div>
              )}
              
              <div className="flex-1 space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-black text-gray-900 tracking-tight">{room.room_name}</h4>
                    <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-black tracking-widest uppercase border border-emerald-100">
                      ₹{room.base_price_per_night} / Night
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-tight">{room.bed_type} • {room.total_inventory} Units Available</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Max Occupancy</p>
                    <p className="text-sm font-bold text-gray-900">{room.max_occupancy} Pax</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Max Capacity</p>
                    <p className="text-sm font-bold text-gray-900">{room.max_adults}A + {room.max_children}C</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    {room.pricing_mode === 'A_LA_CARTE_MEAL' ? 'À-la-carte meal pricing' : 'Customer rate plans'}
                  </p>
                  {room.pricing_mode === 'ROOM_RATE_PLAN' ? (
                    room.rate_plans?.length ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {room.rate_plans.map((plan) => (
                          <div key={plan.id} className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-black text-gray-900">{plan.name}</span>
                              <span className="text-[10px] font-black uppercase text-blue-700">{plan.code}</span>
                            </div>
                            <p className="mt-1 text-xs font-medium text-gray-600">
                              {plan.adjustment_type === 'NONE' ? 'Base room price' : `${plan.adjustment_type}: ${plan.adjustment_value}`}
                              {plan.meal_plan ? ` • ${plan.meal_plan.name}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-amber-700">No active customer rate plans configured.</p>
                    )
                  ) : room.meal_plans?.length ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {room.meal_plans.map((config) => (
                        <div key={config.id} className="rounded-xl border border-orange-100 bg-orange-50/50 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-black text-gray-900">{config.meal_plan.name}</span>
                            <span className="text-[10px] font-black uppercase text-orange-700">{config.meal_plan.code}</span>
                          </div>
                          <p className="mt-1 text-xs font-medium text-gray-600">
                            Adult ₹{config.adult_price} • Child ₹{config.child_price} • Infant ₹{config.infant_price}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-amber-700">No active per-person meal plans configured.</p>
                  )}
                </div>

                {room.amenities && room.amenities.length > 0 && (
                  <div className="pt-6 border-t border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities.map((a, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-bold rounded-md">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {onNext && (
        <div className="flex justify-end pt-4">
          <button 
            onClick={onNext} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2"
          >
            Proceed to B2C Config
          </button>
        </div>
      )}
    </div>
  );
}
