import React from 'react';

// Local type definitions (matching the roadmap page types)
interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: string;
  year: number;
  status: 'planned' | 'in-progress' | 'completed' | 'failed';
  grade?: string;
  prerequisites?: string[];
  description?: string;
  difficulty?: number;
  professor?: string;
  rating?: number;
  semester_id?: string;
}

interface Semester {
  id: string;
  name: string;
  year: number;
  season: 'Fall' | 'Spring' | 'Summer';
  courses: Course[];
  totalCredits: number;
}

interface RoadmapThumbnailProps {
  roadmap: {
    name: string;
    major: string;
    courses: Course[];
    semesters: Semester[];
  };
  className?: string;
}

interface CourseNode {
  id: string;
  code: string;
  name: string;
  credits: number;
  level: number;
  x: number;
  y: number;
  connections: string[];
  status: 'completed' | 'in-progress' | 'planned' | 'failed';
}

const RoadmapThumbnail: React.FC<RoadmapThumbnailProps> = ({ roadmap, className = '' }) => {
  // Generate course nodes with improved positioning
  const generateCourseNodes = (): CourseNode[] => {
    const nodes: CourseNode[] = [];
    const canvasWidth = 800;
    const canvasHeight = 500;
    const nodeSize = 60;
    const padding = 40;
    
    // Group courses by semester for better organization
    const semesterGroups = roadmap.semesters.map(semester => ({
      ...semester,
      courses: roadmap.courses.filter(course => course.semester_id === semester.id)
    }));

    // Calculate grid dimensions
    const totalCourses = roadmap.courses.length;
    const coursesPerRow = Math.ceil(Math.sqrt(totalCourses * 1.5)); // Wider layout
    const rows = Math.ceil(totalCourses / coursesPerRow);
    
    // Calculate spacing
    const availableWidth = canvasWidth - (2 * padding);
    const availableHeight = canvasHeight - (2 * padding) - 60; // Reserve space for title
    const spacingX = availableWidth / (coursesPerRow + 1);
    const spacingY = availableHeight / (rows + 1);

    let courseIndex = 0;
    
    semesterGroups.forEach((semester, semesterIndex) => {
      semester.courses.forEach((course: Course) => {
        const row = Math.floor(courseIndex / coursesPerRow);
        const col = courseIndex % coursesPerRow;
        
        // Calculate position with better distribution
        const x = padding + spacingX * (col + 1);
        const y = padding + 60 + spacingY * (row + 1); // Offset for title
        
        const level = extractCourseLevel(course.code);
        
        nodes.push({
          id: course.id,
          code: course.code,
          name: course.name,
          credits: course.credits,
          level,
          x,
          y,
          connections: inferConnections(course, roadmap.courses),
          status: course.status as any
        });
        
        courseIndex++;
      });
    });

    return nodes;
  };

  const extractCourseLevel = (courseCode: string): number => {
    const match = courseCode.match(/\d+/);
    if (!match) return 1;
    const number = parseInt(match[0]);
    return Math.floor(number / 100);
  };

  const inferConnections = (course: Course, allCourses: Course[]): string[] => {
    const connections: string[] = [];
    const courseLevel = extractCourseLevel(course.code);
    const coursePrefix = course.code.replace(/\d+.*/, '');

    // Find potential prerequisites
    allCourses.forEach(otherCourse => {
      if (otherCourse.id === course.id) return;
      
      const otherLevel = extractCourseLevel(otherCourse.code);
      const otherPrefix = otherCourse.code.replace(/\d+.*/, '');
      
      // Same department, lower level (likely prerequisite)
      if (otherPrefix === coursePrefix && otherLevel < courseLevel && (courseLevel - otherLevel) <= 2) {
        connections.push(otherCourse.id);
      }
      
      // Common prerequisite patterns
      if (isLikelyPrerequisite(otherCourse.name, course.name)) {
        connections.push(otherCourse.id);
      }
    });

    return connections;
  };

  const isLikelyPrerequisite = (prereqName: string, courseName: string): boolean => {
    const patterns = [
      { prereq: /calculus.*i/i, course: /calculus.*ii/i },
      { prereq: /physics.*i/i, course: /physics.*ii/i },
      { prereq: /chemistry.*i/i, course: /chemistry.*ii/i },
      { prereq: /programming.*i/i, course: /programming.*ii/i },
      { prereq: /intro/i, course: /advanced/i },
      { prereq: /fundamentals/i, course: /advanced/i },
    ];

    return patterns.some(pattern => 
      pattern.prereq.test(prereqName) && pattern.course.test(courseName)
    );
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#10b981'; // Emerald-500
      case 'in-progress': return '#3b82f6'; // Blue-500
      case 'failed': return '#ef4444'; // Red-500
      default: return '#6b7280'; // Gray-500
    }
  };

  const nodes = generateCourseNodes();

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      <svg viewBox="0 0 800 500" className="w-full h-full">
        {/* Background */}
        <rect width="100%" height="100%" fill="#000000" />
        
        {/* Grid pattern */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1f2937" strokeWidth="1" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Connection lines */}
        {nodes.map(node => 
          node.connections.map(connectionId => {
            const targetNode = nodes.find(n => n.id === connectionId);
            if (!targetNode) return null;
            
            return (
              <line
                key={`${node.id}-${connectionId}`}
                x1={targetNode.x}
                y1={targetNode.y}
                x2={node.x}
                y2={node.y}
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.7"
                markerEnd="url(#arrowhead)"
              />
            );
          })
        )}

        {/* Arrow marker */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                  refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" opacity="0.7" />
          </marker>
        </defs>

        {/* Course nodes as squares */}
        {nodes.map(node => (
          <g key={node.id}>
            {/* Node shadow */}
            <rect
              x={node.x - 25 + 2}
              y={node.y - 25 + 2}
              width="50"
              height="50"
              rx="8"
              fill="rgba(0,0,0,0.3)"
            />
            
            {/* Node background */}
            <rect
              x={node.x - 25}
              y={node.y - 25}
              width="50"
              height="50"
              rx="8"
              fill={getStatusColor(node.status)}
              stroke="#ffffff"
              strokeWidth="2"
            />
            
            {/* Course code text */}
            <text
              x={node.x}
              y={node.y - 5}
              textAnchor="middle"
              fontSize="8"
              fontWeight="700"
              fill="white"
            >
              {node.code.length > 7 ? node.code.substring(0, 7) : node.code}
            </text>
            
            {/* Credits text */}
            <text
              x={node.x}
              y={node.y + 6}
              textAnchor="middle"
              fontSize="6"
              fill="white"
              opacity="0.9"
            >
              {node.credits} cr
            </text>
          </g>
        ))}

        {/* Title */}
        <text x="400" y="30" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#ffffff">
          {roadmap.name}
        </text>
        
        {/* Major */}
        <text x="400" y="50" textAnchor="middle" fontSize="12" fill="#9ca3af">
          {roadmap.major}
        </text>

        {/* Legend */}
        <g transform="translate(20, 460)">
          <rect x="0" y="0" width="12" height="12" rx="2" fill="#10b981" />
          <text x="18" y="10" fontSize="10" fill="#ffffff">Completed</text>
          
          <rect x="90" y="0" width="12" height="12" rx="2" fill="#3b82f6" />
          <text x="108" y="10" fontSize="10" fill="#ffffff">In Progress</text>
          
          <rect x="180" y="0" width="12" height="12" rx="2" fill="#6b7280" />
          <text x="198" y="10" fontSize="10" fill="#ffffff">Planned</text>
          
          <rect x="250" y="0" width="12" height="12" rx="2" fill="#ef4444" />
          <text x="268" y="10" fontSize="10" fill="#ffffff">Failed</text>
        </g>
      </svg>
    </div>
  );
};

export default RoadmapThumbnail; 