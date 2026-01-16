// Period Selector Components
// Reusable components for selecting time periods in reports and analytics

import React, { useState } from 'react';
import {
    View,
    Text,
    Pressable,
    Modal,
    ScrollView,
    TextInput,
    Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Period types
export type PeriodType = '24h' | '1w' | '1m' | '1y' | 'custom';

export interface Period {
    type: PeriodType;
    label: string;
    startDate: Date;
    endDate: Date;
}

export interface CustomPeriod {
    startDate: Date;
    endDate: Date;
}

// Preset periods configuration
export const PERIOD_OPTIONS: { type: PeriodType; label: string; shortLabel: string; icon: string }[] = [
    { type: '24h', label: 'Last 24 Hours', shortLabel: '24h', icon: 'clock-outline' },
    { type: '1w', label: 'Last 7 Days', shortLabel: '1 Week', icon: 'calendar-week' },
    { type: '1m', label: 'Last 30 Days', shortLabel: '1 Month', icon: 'calendar-month' },
    { type: '1y', label: 'Last 12 Months', shortLabel: '1 Year', icon: 'calendar' },
    { type: 'custom', label: 'Custom Period', shortLabel: 'Custom', icon: 'calendar-range' },
];

// Helper function to calculate period dates
export function getPeriodDates(type: PeriodType, customPeriod?: CustomPeriod): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    let startDate = new Date(now);

    switch (type) {
        case '24h':
            startDate.setHours(startDate.getHours() - 24);
            break;
        case '1w':
            startDate.setDate(startDate.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            break;
        case '1m':
            startDate.setDate(startDate.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
            break;
        case '1y':
            startDate.setFullYear(startDate.getFullYear() - 1);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'custom':
            if (customPeriod) {
                return { startDate: customPeriod.startDate, endDate: customPeriod.endDate };
            }
            // Default to last 30 days if no custom period provided
            startDate.setDate(startDate.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
            break;
    }

    return { startDate, endDate };
}

// Format date for display
function formatDateDisplay(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Format date for input (YYYY-MM-DD)
function formatDateInput(date: Date): string {
    return date.toISOString().split('T')[0];
}

// Parse date from input
function parseDateInput(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

// =====================================================
// PERIOD TAGS COMPONENT (Horizontal scrollable tags)
// =====================================================
interface PeriodTagsProps {
    selectedPeriod: PeriodType;
    onSelect: (period: PeriodType) => void;
    customPeriod?: CustomPeriod;
    onCustomPeriodChange?: (period: CustomPeriod) => void;
    showLabels?: boolean;
}

export function PeriodTags({
    selectedPeriod,
    onSelect,
    customPeriod,
    onCustomPeriodChange,
    showLabels = false,
}: PeriodTagsProps) {
    const [showCustomModal, setShowCustomModal] = useState(false);

    const handleSelect = (type: PeriodType) => {
        if (type === 'custom') {
            setShowCustomModal(true);
        } else {
            onSelect(type);
        }
    };

    return (
        <>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
            >
                {PERIOD_OPTIONS.map((option) => {
                    const isSelected = selectedPeriod === option.type;
                    return (
                        <Pressable
                            key={option.type}
                            onPress={() => handleSelect(option.type)}
                            className={`flex-row items-center px-4 py-2 rounded-full ${isSelected
                                    ? 'bg-green-500'
                                    : 'bg-gray-100 border border-gray-200'
                                }`}
                        >
                            <MaterialCommunityIcons
                                name={option.icon as any}
                                size={16}
                                color={isSelected ? '#fff' : '#6b7280'}
                            />
                            <Text
                                className={`ml-2 font-medium ${isSelected ? 'text-white' : 'text-gray-700'
                                    }`}
                            >
                                {showLabels ? option.label : option.shortLabel}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* Custom Period Modal */}
            <CustomPeriodModal
                visible={showCustomModal}
                onClose={() => setShowCustomModal(false)}
                initialPeriod={customPeriod}
                onConfirm={(period) => {
                    onCustomPeriodChange?.(period);
                    onSelect('custom');
                    setShowCustomModal(false);
                }}
            />
        </>
    );
}

// =====================================================
// PERIOD DROPDOWN COMPONENT
// =====================================================
interface PeriodDropdownProps {
    selectedPeriod: PeriodType;
    onSelect: (period: PeriodType) => void;
    customPeriod?: CustomPeriod;
    onCustomPeriodChange?: (period: CustomPeriod) => void;
    compact?: boolean;
}

export function PeriodDropdown({
    selectedPeriod,
    onSelect,
    customPeriod,
    onCustomPeriodChange,
    compact = false,
}: PeriodDropdownProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showCustomModal, setShowCustomModal] = useState(false);

    const selectedOption = PERIOD_OPTIONS.find((o) => o.type === selectedPeriod);
    const displayLabel = selectedPeriod === 'custom' && customPeriod
        ? `${formatDateDisplay(customPeriod.startDate)} - ${formatDateDisplay(customPeriod.endDate)}`
        : selectedOption?.label || 'Select Period';

    const handleSelect = (type: PeriodType) => {
        setShowDropdown(false);
        if (type === 'custom') {
            setShowCustomModal(true);
        } else {
            onSelect(type);
        }
    };

    return (
        <>
            <Pressable
                onPress={() => setShowDropdown(true)}
                className={`flex-row items-center ${compact ? 'px-3 py-2' : 'px-4 py-3'
                    } bg-white border border-gray-200 rounded-xl`}
            >
                <MaterialCommunityIcons
                    name={(selectedOption?.icon as any) || 'calendar'}
                    size={compact ? 18 : 20}
                    color="#22c55e"
                />
                <Text
                    className={`flex-1 ${compact ? 'mx-2 text-sm' : 'mx-3'} text-gray-900 font-medium`}
                    numberOfLines={1}
                >
                    {compact ? selectedOption?.shortLabel : displayLabel}
                </Text>
                <MaterialCommunityIcons
                    name="chevron-down"
                    size={compact ? 18 : 20}
                    color="#9ca3af"
                />
            </Pressable>

            {/* Dropdown Modal */}
            <Modal
                visible={showDropdown}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDropdown(false)}
            >
                <Pressable
                    className="flex-1 bg-black/50 justify-end"
                    onPress={() => setShowDropdown(false)}
                >
                    <View className="bg-white rounded-t-3xl">
                        <View className="p-4 border-b border-gray-100">
                            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
                            <Text className="text-lg font-bold text-gray-900 text-center">
                                Select Time Period
                            </Text>
                        </View>
                        <View className="pb-8">
                            {PERIOD_OPTIONS.map((option) => {
                                const isSelected = selectedPeriod === option.type;
                                return (
                                    <Pressable
                                        key={option.type}
                                        onPress={() => handleSelect(option.type)}
                                        className={`flex-row items-center px-6 py-4 ${isSelected ? 'bg-green-50' : ''
                                            }`}
                                    >
                                        <View
                                            className={`w-10 h-10 rounded-full items-center justify-center ${isSelected ? 'bg-green-100' : 'bg-gray-100'
                                                }`}
                                        >
                                            <MaterialCommunityIcons
                                                name={option.icon as any}
                                                size={20}
                                                color={isSelected ? '#22c55e' : '#6b7280'}
                                            />
                                        </View>
                                        <View className="flex-1 ml-4">
                                            <Text
                                                className={`text-base font-medium ${isSelected ? 'text-green-700' : 'text-gray-900'
                                                    }`}
                                            >
                                                {option.label}
                                            </Text>
                                            {option.type === 'custom' && customPeriod && isSelected && (
                                                <Text className="text-sm text-gray-500 mt-0.5">
                                                    {formatDateDisplay(customPeriod.startDate)} - {formatDateDisplay(customPeriod.endDate)}
                                                </Text>
                                            )}
                                        </View>
                                        {isSelected && (
                                            <MaterialCommunityIcons
                                                name="check-circle"
                                                size={24}
                                                color="#22c55e"
                                            />
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                </Pressable>
            </Modal>

            {/* Custom Period Modal */}
            <CustomPeriodModal
                visible={showCustomModal}
                onClose={() => setShowCustomModal(false)}
                initialPeriod={customPeriod}
                onConfirm={(period) => {
                    onCustomPeriodChange?.(period);
                    onSelect('custom');
                    setShowCustomModal(false);
                }}
            />
        </>
    );
}

// =====================================================
// CUSTOM PERIOD MODAL
// =====================================================
interface CustomPeriodModalProps {
    visible: boolean;
    onClose: () => void;
    initialPeriod?: CustomPeriod;
    onConfirm: (period: CustomPeriod) => void;
}

function CustomPeriodModal({ visible, onClose, initialPeriod, onConfirm }: CustomPeriodModalProps) {
    const [startDateStr, setStartDateStr] = useState(
        initialPeriod ? formatDateInput(initialPeriod.startDate) : formatDateInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    );
    const [endDateStr, setEndDateStr] = useState(
        initialPeriod ? formatDateInput(initialPeriod.endDate) : formatDateInput(new Date())
    );
    const [error, setError] = useState<string | null>(null);

    // Quick select presets
    const QUICK_PRESETS = [
        { label: 'Last 7 days', days: 7 },
        { label: 'Last 14 days', days: 14 },
        { label: 'Last 30 days', days: 30 },
        { label: 'Last 90 days', days: 90 },
        { label: 'This month', type: 'thisMonth' },
        { label: 'Last month', type: 'lastMonth' },
        { label: 'This year', type: 'thisYear' },
    ];

    const applyPreset = (preset: typeof QUICK_PRESETS[0]) => {
        const now = new Date();
        let start: Date;
        let end: Date = new Date(now);

        if (preset.days) {
            start = new Date(now.getTime() - preset.days * 24 * 60 * 60 * 1000);
        } else if (preset.type === 'thisMonth') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (preset.type === 'lastMonth') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
        } else if (preset.type === 'thisYear') {
            start = new Date(now.getFullYear(), 0, 1);
            end = now;
        } else {
            return;
        }

        setStartDateStr(formatDateInput(start));
        setEndDateStr(formatDateInput(end));
        setError(null);
    };

    const handleConfirm = () => {
        try {
            const startDate = parseDateInput(startDateStr);
            const endDate = parseDateInput(endDateStr);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                setError('Please enter valid dates');
                return;
            }

            if (startDate > endDate) {
                setError('Start date must be before end date');
                return;
            }

            if (endDate > new Date()) {
                setError('End date cannot be in the future');
                return;
            }

            endDate.setHours(23, 59, 59, 999);
            startDate.setHours(0, 0, 0, 0);

            onConfirm({ startDate, endDate });
        } catch {
            setError('Invalid date format');
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl">
                    {/* Header */}
                    <View className="p-4 border-b border-gray-100">
                        <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
                        <View className="flex-row items-center justify-between">
                            <Text className="text-lg font-bold text-gray-900">Custom Period</Text>
                            <Pressable onPress={onClose}>
                                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
                            </Pressable>
                        </View>
                    </View>

                    <ScrollView className="max-h-96">
                        {/* Quick Presets */}
                        <View className="p-4">
                            <Text className="text-sm font-medium text-gray-500 mb-3">Quick Select</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {QUICK_PRESETS.map((preset) => (
                                    <Pressable
                                        key={preset.label}
                                        onPress={() => applyPreset(preset)}
                                        className="px-3 py-2 bg-gray-100 rounded-lg"
                                    >
                                        <Text className="text-sm text-gray-700">{preset.label}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Date Inputs */}
                        <View className="p-4 border-t border-gray-100">
                            <Text className="text-sm font-medium text-gray-500 mb-3">Or Enter Dates</Text>

                            <View className="flex-row gap-4">
                                {/* Start Date */}
                                <View className="flex-1">
                                    <Text className="text-sm text-gray-700 mb-2">Start Date</Text>
                                    <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                                        <MaterialCommunityIcons name="calendar-start" size={20} color="#6b7280" />
                                        <TextInput
                                            className="flex-1 ml-3 text-gray-900"
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor="#9ca3af"
                                            value={startDateStr}
                                            onChangeText={(text) => {
                                                setStartDateStr(text);
                                                setError(null);
                                            }}
                                            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                                        />
                                    </View>
                                </View>

                                {/* End Date */}
                                <View className="flex-1">
                                    <Text className="text-sm text-gray-700 mb-2">End Date</Text>
                                    <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                                        <MaterialCommunityIcons name="calendar-end" size={20} color="#6b7280" />
                                        <TextInput
                                            className="flex-1 ml-3 text-gray-900"
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor="#9ca3af"
                                            value={endDateStr}
                                            onChangeText={(text) => {
                                                setEndDateStr(text);
                                                setError(null);
                                            }}
                                            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                                        />
                                    </View>
                                </View>
                            </View>

                            {error && (
                                <View className="mt-3 bg-red-50 rounded-lg p-3">
                                    <Text className="text-red-600 text-sm">{error}</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Actions */}
                    <View className="p-4 border-t border-gray-100 flex-row gap-3">
                        <Pressable
                            onPress={onClose}
                            className="flex-1 py-4 bg-gray-100 rounded-xl items-center"
                        >
                            <Text className="text-gray-700 font-semibold">Cancel</Text>
                        </Pressable>
                        <Pressable
                            onPress={handleConfirm}
                            className="flex-1 py-4 bg-green-500 rounded-xl items-center"
                        >
                            <Text className="text-white font-semibold">Apply</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// =====================================================
// PERIOD DISPLAY (Shows current selected period)
// =====================================================
interface PeriodDisplayProps {
    period: PeriodType;
    customPeriod?: CustomPeriod;
}

export function PeriodDisplay({ period, customPeriod }: PeriodDisplayProps) {
    const { startDate, endDate } = getPeriodDates(period, customPeriod);
    const option = PERIOD_OPTIONS.find((o) => o.type === period);

    return (
        <View className="flex-row items-center">
            <MaterialCommunityIcons
                name={(option?.icon as any) || 'calendar'}
                size={16}
                color="#6b7280"
            />
            <Text className="ml-2 text-sm text-gray-600">
                {formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}
            </Text>
        </View>
    );
}

export default {
    PeriodTags,
    PeriodDropdown,
    PeriodDisplay,
    getPeriodDates,
    PERIOD_OPTIONS,
};
