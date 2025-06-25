export default function MajorCoursesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">Major Courses</h1>
        <p className="text-lg text-gray-600 mb-6">
          Different courses from the same major will be shown here.
        </p>
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <p className="text-gray-500">
            This page will display all courses available for the selected major.
            Course listings and details will be populated here.
          </p>
        </div>
      </div>
    </div>
  );
}
