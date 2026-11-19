import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Department, User } from "../types";
import {
  Building2, Users, PlusCircle, Mail, Briefcase, CheckCircle2,
  Shield, UserPlus
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Select } from "../components/ui/Select";
import { Alert } from "../components/ui/Alert";

export const DepartmentManagementPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [deptStaff, setDeptStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [deptDesc, setDeptDesc] = useState("");
  const [deptEmail, setDeptEmail] = useState("");

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("Staff@123");
  const [staffDeptId, setStaffDeptId] = useState<number | undefined>(undefined);

  const [message, setMessage] = useState<string | null>(null);

  const fetchDepartments = async () => {
    try {
      const data = await api.getDepartments();
      setDepartments(data);
      if (data.length > 0 && !selectedDept) {
        setSelectedDept(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async (deptId: number) => {
    try {
      const staffList = await api.getDepartmentStaff(deptId);
      setDeptStaff(staffList);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDept) {
      fetchStaff(selectedDept.id);
    }
  }, [selectedDept]);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDepartment({
        name: deptName,
        code: deptCode,
        description: deptDesc,
        contact_email: deptEmail || undefined,
      });
      setShowDeptModal(false);
      setDeptName("");
      setDeptCode("");
      setDeptDesc("");
      setDeptEmail("");
      setMessage("Department created successfully.");
      fetchDepartments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffDeptId) return;
    try {
      await api.createUserAdmin({
        email: staffEmail,
        full_name: staffName,
        password: staffPassword,
        role: "staff",
        department_id: staffDeptId,
      });
      setShowStaffModal(false);
      setStaffName("");
      setStaffEmail("");
      setMessage("Staff member registered successfully.");
      if (selectedDept?.id === staffDeptId) {
        fetchStaff(staffDeptId);
      }
      fetchDepartments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Department & Staff Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure automated routing departments and staff assignment privileges
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowDeptModal(true)}>
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Add Department
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setStaffDeptId(selectedDept?.id || departments[0]?.id);
              setShowStaffModal(true);
            }}
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {message && (
        <Alert variant="success" className="mb-4">
          {message}
        </Alert>
      )}

      {/* Main Layout: Department List (Left) & Department Staff (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Department List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Active Departments ({departments.length})
          </h3>
          <div className="space-y-2">
            {departments.map((dept) => (
              <div
                key={dept.id}
                onClick={() => setSelectedDept(dept)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedDept?.id === dept.id
                    ? "bg-white border-primary shadow-subtle ring-2 ring-primary/10"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{dept.name}</span>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {dept.code}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                  {dept.description || "No description provided"}
                </p>
                <div className="flex items-center gap-4 mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span>Staff: <strong>{dept.staff_count}</strong></span>
                  <span>Active Queue: <strong>{dept.active_complaints_count}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Selected Department Detail & Staff */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDept && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Selected Department
                      </div>
                      <CardTitle className="text-lg mt-0.5">{selectedDept.name}</CardTitle>
                    </div>
                    <span className="font-mono text-xs font-black px-2.5 py-1 bg-primary text-white rounded-md">
                      {selectedDept.code}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">DESCRIPTION</span>
                    <p className="text-slate-700 leading-relaxed mt-0.5">{selectedDept.description}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">CONTACT EMAIL</span>
                    <a
                      href={`mailto:${selectedDept.contact_email}`}
                      className="text-primary font-semibold hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {selectedDept.contact_email || "N/A"}
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Staff Members List */}
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">
                      Staff Assigned to {selectedDept.name} ({deptStaff.length})
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Technicians and wardens with claim and resolution privileges
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStaffDeptId(selectedDept.id);
                      setShowStaffModal(true);
                    }}
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1" />
                    Add Staff
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {deptStaff.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No staff members assigned to this department yet. Click Add Staff above to register one.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {deptStaff.map((s) => (
                        <div key={s.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                              {s.full_name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{s.full_name}</div>
                              <div className="text-[11px] text-slate-500">{s.email}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* MODAL: Create Department */}
      <Modal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        title="Add New Department"
        description="Define a university service department for complaint routing."
      >
        <form onSubmit={handleCreateDept} className="space-y-4">
          <Input
            label="Department Name"
            required
            placeholder="e.g. Campus Transport & Bus Service"
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
          />
          <Input
            label="Department Code (Short Acronym)"
            required
            placeholder="e.g. TRANS"
            value={deptCode}
            onChange={(e) => setDeptCode(e.target.value)}
          />
          <Textarea
            label="Department Mandate & Description"
            rows={3}
            placeholder="Describe facility domains covered..."
            value={deptDesc}
            onChange={(e) => setDeptDesc(e.target.value)}
          />
          <Input
            label="Official Contact Email"
            type="email"
            placeholder="transport@campuscare.edu"
            value={deptEmail}
            onChange={(e) => setDeptEmail(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowDeptModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Create Staff Account */}
      <Modal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        title="Register Department Staff Member"
        description="Creates an operational account with access to departmental queues."
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <Input
            label="Full Name"
            required
            placeholder="e.g. Johnathan Hayes"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
          />
          <Input
            label="Staff Email"
            type="email"
            required
            placeholder="j.hayes@campuscare.edu"
            value={staffEmail}
            onChange={(e) => setStaffEmail(e.target.value)}
          />
          <Input
            label="Temporary Password"
            type="password"
            required
            value={staffPassword}
            onChange={(e) => setStaffPassword(e.target.value)}
          />
          <Select
            label="Department"
            required
            value={staffDeptId || ""}
            onChange={(e) => setStaffDeptId(Number(e.target.value))}
            options={departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowStaffModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Register Staff Member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
