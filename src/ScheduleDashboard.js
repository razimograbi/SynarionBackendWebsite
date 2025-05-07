import { useState, useEffect } from 'react';
import {
  ClockIcon,
  CalendarIcon,
  ExclamationCircleIcon,
  CheckIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { scheduleService, timeOffService } from './api';

const mockScheduleData = {
  Sunday: { startTime: '09:00', endTime: '17:30' },
  Monday: { startTime: '09:00', endTime: '17:30' },
  Tuesday: { startTime: '09:00', endTime: '17:30' },
  Wednesday: { startTime: '09:00', endTime: '17:30' },
  Thursday: { startTime: '09:00', endTime: '17:30' }
};

const defaultTimeOff = {
  type: 'vacation',
  startDate: '',
  endDate: '',
  description: ''
};

export default function ScheduleDashboard() {
  const [scheduleData, setScheduleData] = useState(mockScheduleData);
  // Fix 1: Initialize timeOffData as an array
  const [timeOffData, setTimeOffData] = useState([]);
  const [newTimeOff, setNewTimeOff] = useState(defaultTimeOff); // Changed to use defaultTimeOff for consistency
  const [editingTimeOff, setEditingTimeOff] = useState(null);

  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setErrors({});
      try {
        const schedule = await scheduleService.getSchedule();
        const filteredSchedule = Object.keys(schedule)
          .filter(key => !['_id', 'userId', '__v'].includes(key))
          .reduce((obj, key) => {
            obj[key] = schedule[key];
            return obj;
          }, {});
        setScheduleData(filteredSchedule);
  
        const timeOff = await timeOffService.getAllTimeOff();
        setTimeOffData(timeOff.map(item => ({ ...item, id: item._id || item.id })));
      } catch (error) {
        console.error('Error fetching data:', error);
        handleApiError(error, 'Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchData();
  }, []);
  

  const handleScheduleChange = (day, field, value) => {
    setScheduleData({
      ...scheduleData,
      [day]: { ...scheduleData[day], [field]: value }
    });
  };

  const validateSchedule = (data) => {
    const errors = {};
    for (const day in data) {
      if (data[day].startTime && data[day].endTime) {
        if (data[day].startTime >= data[day].endTime) {
          errors[day] = `Start time must be before end time on ${day}`;
        }
      }
    }
    return errors;
  };

  const handleUpdateSchedule = async () => {
    const validationErrors = validateSchedule(scheduleData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showNotification('Please fix the errors in your schedule.', 'error');
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      const result = await scheduleService.updateSchedule(scheduleData);
      showNotification('Schedule updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating schedule:', error);
      handleApiError(error, 'Failed to update schedule. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeOffInputChange = (field, value) => {
    setNewTimeOff(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'type' && value === 'dayOff') {
        updated.endDate = prev.startDate;
      }
      if (field === 'startDate' && prev.type === 'dayOff') {
        updated.endDate = value;
      }
      return updated;
    });
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validateTimeOff = (data) => {
    const errors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!data.type) errors.type = "Type is required";
    if (!data.startDate) errors.startDate = "Start date is required";
    if (data.startDate) {
      const startDate = new Date(data.startDate);
      if (startDate < today) {
        errors.startDate = "Start date cannot be in the past";
      }
      if (data.type === 'vacation') {
        if (!data.endDate) {
          errors.endDate = "End date is required for vacations";
        } else {
          const endDate = new Date(data.endDate);
          if (endDate < startDate) {
            errors.endDate = "End date must be after start date";
          }
        }
      }
    }
    return errors;
  };

  const handleAddTimeOff = async () => {
    const validationErrors = validateTimeOff(newTimeOff);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showNotification('Please fill in all required fields correctly.', 'error');
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      const newEntry = await timeOffService.addTimeOff(newTimeOff);
      // Fix 3: Normalize id field
      setTimeOffData(prev => [...prev, { ...newEntry, id: newEntry._id || newEntry.id }]);
      setNewTimeOff(defaultTimeOff);
      showNotification('Time off added successfully!', 'success');
    } catch (error) {
      console.error('Error adding time off:', error);
      handleApiError(error, 'Failed to add time off. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fix 2: Simplify handleEditTimeOff to set editing state only
  const handleEditTimeOff = (id) => {
    const timeOff = timeOffData.find(item => item.id === id);
    if (timeOff) {
      setEditingTimeOff(timeOff);
    }
  };

  const handleSaveTimeOff = async () => {
    if (!editingTimeOff.startDate) {
      showNotification('Please select a start date', 'error');
      return;
    }
    if (editingTimeOff.type === 'vacation') {
      if (!editingTimeOff.endDate) {
        showNotification('Please select an end date', 'error');
        return;
      }
      if (editingTimeOff.endDate < editingTimeOff.startDate) {
        showNotification('End date must be after start date', 'error');
        return;
      }
    }
    setIsLoading(true);
    try {
      const updatedEntry = await timeOffService.updateTimeOff(editingTimeOff.id, editingTimeOff);
      // Fix 3: Normalize id field
      setTimeOffData(prev => prev.map(item => 
        item.id === updatedEntry.id ? { ...updatedEntry, id: updatedEntry._id || updatedEntry.id } : item
      ));
      setEditingTimeOff(null);
      showNotification('Time off updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating time off:', error);
      showNotification('Failed to update time off. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTimeOff = async (id) => {
    if (window.confirm('Are you sure you want to delete this time off entry?')) {
      setIsLoading(true);
      try {
        await timeOffService.deleteTimeOff(id);
        setTimeOffData(prev => prev.filter(item => item.id !== id));
        showNotification('Time off deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting time off:', error);
        showNotification('Failed to delete time off. Please try again.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleApiError = (error, defaultMessage) => {
    let errorMessage = defaultMessage;
    if (error.response && error.response.data) {
      if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      if (error.response.data.errors) {
        setErrors(error.response.data.errors);
      }
    }
    showNotification(errorMessage, 'error');
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const formatTime = (time24h) => {
    if (typeof time24h !== 'string') {
      console.error('Invalid time format:', time24h);
      return 'Invalid time';
    }
    const [hours, minutes] = time24h.split(':');
    const hour = parseInt(hours, 10);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12}:${minutes} ${suffix}`;
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    if (startDate === endDate) return start.toLocaleDateString('en-US', options);
    const end = new Date(endDate);
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight">Schedule Management</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Fix 5: Add close button to notification */}
        {notification && (
          <div className={`mb-8 p-4 rounded-lg shadow-md flex items-center justify-between animate-fade-in ${
            notification.type === 'success' ? 'bg-green-100 text-green-900' :
            notification.type === 'error' ? 'bg-red-100 text-red-900' :
            'bg-blue-100 text-blue-900'
          }`}>
            <div className="flex items-center">
              {notification.type === 'success' && <CheckIcon className="w-6 h-6 mr-3" />}
              {notification.type === 'error' && <XMarkIcon className="w-6 h-6 mr-3" />}
              {notification.type === 'info' && <ExclamationCircleIcon className="w-6 h-6 mr-3" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-gray-700">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        <section className="bg-white rounded-xl shadow-lg mb-10 overflow-hidden">
          <div className="px-6 py-5 bg-gray-50 border-b border-gray-200 flex items-center">
            <ClockIcon className="w-6 h-6 mr-3 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800">Weekly Working Hours</h2>
          </div>
          <div className="px-6 py-4 bg-amber-50 flex items-start">
            <div className='flex justify-center items-center'>
              <ExclamationCircleIcon className="w-6 h-6 mr-3 md-1 text-amber-600 mt-1" />
              <p className="text-sm text-amber-800">
                Note: Registration hours on Synarion may differ by 10 minutes.
              </p>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
              {Object.keys(scheduleData)
                .filter(key => key !== '_id' && key !== 'userId' && key !== '__v')
                .map(day => (
                  <div key={day} className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">{day}</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={scheduleData[day].startTime}
                          onChange={(e) => handleScheduleChange(day, 'startTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                        <p className="mt-1 text-xs text-gray-600">{formatTime(scheduleData[day].startTime)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                        <input
                          type="time"
                          value={scheduleData[day].endTime}
                          onChange={(e) => handleScheduleChange(day, 'endTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                        <p className="mt-1 text-xs text-gray-600">{formatTime(scheduleData[day].endTime)}</p>
                      </div>
                      {/* Fix 4: Display schedule errors */}
                      {errors[day] && <p className="mt-2 text-sm text-red-600">{errors[day]}</p>}
                    </div>
                  </div>
                ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                disabled={isLoading}
                onClick={handleUpdateSchedule}
                className="bg-indigo-600 text-white px-5 py-2 rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all flex items-center"
              >
                {isLoading && (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                )}
                <CheckIcon className="w-5 h-5 mr-2" />
                Update Hours
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-5 bg-gray-50 border-b border-gray-200 flex items-center">
            <CalendarIcon className="w-6 h-6 mr-3 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800">Vacations & Days Off</h2>
          </div>

          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-5">Add New Time Off</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newTimeOff.type}
                  onChange={(e) => handleTimeOffInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="vacation">Vacation</option>
                  <option value="dayOff">Day Off</option>
                </select>
                {/* Fix 4: Display type error */}
                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={newTimeOff.startDate}
                  onChange={(e) => handleTimeOffInputChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {/* Fix 4: Display startDate error */}
                {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
              </div>
              {newTimeOff.type === 'vacation' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newTimeOff.endDate}
                    onChange={(e) => handleTimeOffInputChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {/* Fix 4: Display endDate error */}
                  {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newTimeOff.description}
                  onChange={(e) => handleTimeOffInputChange('description', e.target.value)}
                  placeholder="E.g., Family vacation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {/* Fix 4: Display description error (if applicable) */}
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                disabled={isLoading}
                onClick={handleAddTimeOff}
                className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all flex items-center"
              >
                {isLoading && (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                )}
                <CheckIcon className="w-5 h-5 mr-2" />
                Add Time Off
              </button>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-5">Your Scheduled Time Off</h3>
            {timeOffData.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <CalendarIcon className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                <p className="text-lg">No time off scheduled yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {timeOffData
                  .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                  .map(item => (
                    <li key={item.id} className="py-4 hover:bg-gray-50 transition-colors">
                      {editingTimeOff && editingTimeOff.id === item.id ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                              value={editingTimeOff.type}
                              onChange={(e) => setEditingTimeOff({
                                ...editingTimeOff,
                                type: e.target.value,
                                endDate: e.target.value === 'dayOff' ? editingTimeOff.startDate : editingTimeOff.endDate
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="vacation">Vacation</option>
                              <option value="dayOff">Day Off</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                              type="date"
                              value={editingTimeOff.startDate}
                              onChange={(e) => setEditingTimeOff({
                                ...editingTimeOff,
                                startDate: e.target.value,
                                endDate: editingTimeOff.type === 'dayOff' ? e.target.value : editingTimeOff.endDate
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          {editingTimeOff.type === 'vacation' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                              <input
                                type="date"
                                value={editingTimeOff.endDate}
                                onChange={(e) => setEditingTimeOff({ ...editingTimeOff, endDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                              type="text"
                              value={editingTimeOff.description}
                              onChange={(e) => setEditingTimeOff({ ...editingTimeOff, description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="col-span-full flex justify-end space-x-3">
                            <button
                              disabled={isLoading}
                              onClick={() => setEditingTimeOff(null)}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              disabled={isLoading}
                              onClick={handleSaveTimeOff}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between px-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                item.type === 'vacation' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {item.type === 'vacation' ? 'Vacation' : 'Day Off'}
                              </span>
                              {item.description && (
                                <span className="text-sm text-gray-600">{item.description}</span>
                              )}
                              {item.status && (
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                  item.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                  item.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-gray-700">{formatDateRange(item.startDate, item.endDate)}</p>
                          </div>
                          <div className="flex space-x-2">
                            {/* Fix 3: Use item.id consistently */}
                            <button
                              disabled={isLoading}
                              onClick={() => handleEditTimeOff(item.id)}
                              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              disabled={isLoading}
                              onClick={() => handleDeleteTimeOff(item.id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in;
        }
      `}</style>
    </div>
  );
}