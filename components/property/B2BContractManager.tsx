'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminPropertyService } from '@/services/adminPropertyService';
import type { B2BContract, B2BCommissionType, PaxMatrixData } from '@/types/property';
import { Loader2, Plus, Trash2, Building, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  hotelId: number;
}

const DEFAULT_PAX_MATRIX: PaxMatrixData = {
  columns: ['2 PAX', '3 PAX with Extra Bed', '4 PAX', '6 PAX', '8 PAX', 'Extra Person'],
  rows: ['EPAI', 'CPAI', 'MAPAI', 'APAI'],
  data: {
    'EPAI': { '2 PAX': 5300, '3 PAX with Extra Bed': 6500, '4 PAX': 9100, '6 PAX': 12900, '8 PAX': 16700, 'Extra Person': 1200 },
    'CPAI': { '2 PAX': 5700, '3 PAX with Extra Bed': 7100, '4 PAX': 9900, '6 PAX': 14100, '8 PAX': 18300, 'Extra Person': 1400 },
    'MAPAI': { '2 PAX': 6300, '3 PAX with Extra Bed': 8000, '4 PAX': 11100, '6 PAX': 15900, '8 PAX': 20700, 'Extra Person': 1700 },
    'APAI': { '2 PAX': 7100, '3 PAX with Extra Bed': 9200, '4 PAX': 12700, '6 PAX': 18300, '8 PAX': 23900, 'Extra Person': 2100 },
  }
};

export default function B2BContractManager({ hotelId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState<B2BContract | null>(null);
  
  const [commissionType, setCommissionType] = useState<B2BCommissionType>('PERCENTAGE');
  const [commissionValue, setCommissionValue] = useState<string>('0.00');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [paxMatrix, setPaxMatrix] = useState<PaxMatrixData>({ columns: [], rows: [], data: {} });

  const [newColName, setNewColName] = useState('');
  const [newRowName, setNewRowName] = useState('');

  const fetchContract = React.useCallback(async () => {
    try {
      setLoading(true);
      const existing = await adminPropertyService.getB2BContract(hotelId);
      if (existing) {
        setContract(existing);
        setCommissionType(existing.commission_type);
        setCommissionValue(existing.value);
        setIsActive(existing.is_active);
        
        if (existing.commission_type === 'PAX_MATRIX' && existing.pax_matrix_json) {
           setPaxMatrix(existing.pax_matrix_json);
        } else {
           setPaxMatrix({ columns: [], rows: [], data: {} });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load B2B Contract details');
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: B2BContract = {
        id: contract?.id,
        hotel: hotelId,
        commission_type: commissionType,
        value: commissionType === 'PAX_MATRIX' ? '0.00' : commissionValue,
        pax_matrix_json: commissionType === 'PAX_MATRIX' ? paxMatrix : null,
        is_active: isActive,
      };

      let savedContract;
      if (contract?.id) {
        savedContract = await adminPropertyService.updateB2BContract(contract.id, payload);
        toast.success('B2B Contract updated');
      } else {
        savedContract = await adminPropertyService.createB2BContract(payload);
        toast.success('B2B Contract created');
      }
      setContract(savedContract);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save B2B Contract');
    } finally {
      setSaving(false);
    }
  };

  const handleCellChange = (row: string, col: string, val: string) => {
    setPaxMatrix(prev => {
      const newData = { ...prev.data };
      if (!newData[row]) newData[row] = {};
      newData[row][col] = val;
      return { ...prev, data: newData };
    });
  };

  const addColumn = () => {
    if (!newColName.trim()) return;
    if (paxMatrix.columns.includes(newColName.trim())) {
        toast.error('Column already exists');
        return;
    }
    setPaxMatrix(prev => ({
        ...prev,
        columns: [...prev.columns, newColName.trim()]
    }));
    setNewColName('');
  };

  const addRow = () => {
    if (!newRowName.trim()) return;
    if (paxMatrix.rows.includes(newRowName.trim())) {
        toast.error('Row already exists');
        return;
    }
    setPaxMatrix(prev => ({
        ...prev,
        rows: [...prev.rows, newRowName.trim()],
        data: { ...prev.data, [newRowName.trim()]: {} }
    }));
    setNewRowName('');
  };

  const removeColumn = (colToRemove: string) => {
      setPaxMatrix(prev => {
          const newCols = prev.columns.filter(c => c !== colToRemove);
          const newData = { ...prev.data };
          return { ...prev, columns: newCols, data: newData };
      });
  };

  const removeRow = (rowToRemove: string) => {
    setPaxMatrix(prev => {
        const newRows = prev.rows.filter(r => r !== rowToRemove);
        const newData = { ...prev.data };
        delete newData[rowToRemove];
        return { ...prev, rows: newRows, data: newData };
    });
  };

  const loadTemplate = () => {
      setPaxMatrix(DEFAULT_PAX_MATRIX);
  };

  if (loading) {
    return (
      <Card className="rounded-[24px] border-gray-200 overflow-hidden shadow-sm mt-8">
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[24px] border-gray-200 overflow-hidden shadow-sm mt-8">
      <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Building className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-base font-black uppercase tracking-tight">B2B Agent Configuration</CardTitle>
        </div>
        <div className="flex items-center gap-3">
            <label className="text-sm font-bold flex items-center gap-2 cursor-pointer text-gray-700">
                <input 
                    type="checkbox" 
                    checked={isActive} 
                    onChange={e => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Active Contract
            </label>
            <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20"
            >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Contract
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        
        {/* Basic Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Commission Type</label>
            <select 
              value={commissionType}
              onChange={(e) => setCommissionType(e.target.value as B2BCommissionType)}
              className="w-full rounded-xl border-gray-200 font-bold text-sm h-12 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="PERCENTAGE">Percentage (%) - Agent TAC</option>
              <option value="FLAT">Flat Rate (₹) - Agent TAC</option>
              <option value="PAX_MATRIX">Pax Matrix (Bundled Fixed Rate)</option>
            </select>
          </div>
          
          {commissionType !== 'PAX_MATRIX' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Commission Value</label>
              <Input 
                type="number"
                step="0.01"
                value={commissionValue}
                onChange={(e) => setCommissionValue(e.target.value)}
                className="h-12 font-bold text-sm rounded-xl"
                placeholder="e.g. 15.00"
              />
            </div>
          )}
        </div>

        {/* PAX Matrix UI */}
        {commissionType === 'PAX_MATRIX' && (
            <div className="space-y-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black uppercase text-gray-900 tracking-tight">Pax / Meal Plan Pricing Grid</h3>
                        <p className="text-xs font-medium text-gray-500 mt-1">Configure fixed bundled pricing based on capacity and meal plans.</p>
                    </div>
                    {paxMatrix.columns.length === 0 && paxMatrix.rows.length === 0 && (
                        <Button onClick={loadTemplate} variant="outline" className="font-bold border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">
                            Load Standard Template
                        </Button>
                    )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="p-4 border-b border-r border-gray-200 min-w-[150px]">
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="New Meal Plan..." 
                                            value={newRowName} 
                                            onChange={e => setNewRowName(e.target.value)}
                                            className="h-8 text-xs font-bold"
                                        />
                                        <Button size="sm" variant="outline" onClick={addRow} className="h-8 px-2">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </th>
                                {paxMatrix.columns.map(col => (
                                    <th key={col} className="p-3 border-b border-r border-gray-200 text-center min-w-[120px] bg-red-600 text-white group">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest">{col}</span>
                                            <button onClick={() => removeColumn(col)} className="text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </th>
                                ))}
                                <th className="p-3 border-b border-gray-200 min-w-[200px] bg-red-600">
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="New Pax..." 
                                            value={newColName} 
                                            onChange={e => setNewColName(e.target.value)}
                                            className="h-8 text-xs font-bold bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                        />
                                        <Button size="sm" onClick={addColumn} className="h-8 px-2 bg-white text-red-600 hover:bg-gray-100">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paxMatrix.rows.map(row => (
                                <tr key={row} className="border-b border-gray-200 hover:bg-gray-50/50">
                                    <td className="p-3 border-r border-gray-200 bg-blue-50/30">
                                        <div className="flex items-center justify-between group">
                                            <span className="text-xs font-bold text-gray-700">{row}</span>
                                            <button onClick={() => removeRow(row)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>
                                    {paxMatrix.columns.map(col => (
                                        <td key={col} className="p-2 border-r border-gray-200">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                                                <Input 
                                                    type="number"
                                                    value={paxMatrix.data[row]?.[col] || ''}
                                                    onChange={e => handleCellChange(row, col, e.target.value)}
                                                    className="h-9 text-xs font-bold pl-7 pr-2 rounded-lg text-right focus:bg-white"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </td>
                                    ))}
                                    <td className="p-3 bg-gray-50"></td>
                                </tr>
                            ))}
                            {paxMatrix.rows.length === 0 && (
                                <tr>
                                    <td colSpan={paxMatrix.columns.length + 2} className="p-8 text-center text-gray-500">
                                        <AlertCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm font-medium">No rows configured. Add a meal plan or load the template.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

      </CardContent>
    </Card>
  );
}
