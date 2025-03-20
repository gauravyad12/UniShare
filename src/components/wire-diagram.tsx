"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WireDiagram() {
  return (
    <div className="container mx-auto p-4 bg-white dark:bg-gray-950">
      <h1 className="text-3xl font-bold mb-6 text-center">
        University Study Hub - System Architecture
      </h1>

      <Tabs defaultValue="auth" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="groups">Study Groups</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="profile">User Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="auth" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <h2 className="text-2xl font-semibold mb-4">
                  Authentication Flow
                </h2>
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 w-full max-w-3xl">
                  <div className="flex flex-col space-y-6">
                    {/* Start */}
                    <div className="flex justify-center">
                      <div className="bg-primary/10 rounded-lg p-4 text-center w-48">
                        <p className="font-medium">User Visits Platform</p>
                      </div>
                    </div>

                    {/* Decision */}
                    <div className="flex justify-center">
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-4 text-center w-48 border border-yellow-200 dark:border-yellow-800">
                        <p className="font-medium">Has Account?</p>
                      </div>
                    </div>

                    {/* Paths */}
                    <div className="flex justify-between">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <p className="text-sm text-gray-500">No</p>
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 text-center w-48 border border-blue-200 dark:border-blue-800">
                          <p className="font-medium">Sign Up Page</p>
                        </div>
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Enter University Email</p>
                        </div>
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Enter Invite Code</p>
                        </div>
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Create Password</p>
                        </div>
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Verification Email Sent</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <p className="text-sm text-gray-500">Yes</p>
                        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 text-center w-48 border border-green-200 dark:border-green-800">
                          <p className="font-medium">Login Page</p>
                        </div>
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Enter Email & Password</p>
                        </div>
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-4 text-center w-48 border border-yellow-200 dark:border-yellow-800">
                          <p className="font-medium">Valid Credentials?</p>
                        </div>
                      </div>
                    </div>

                    {/* Verification Decision */}
                    <div className="flex justify-center mt-4">
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-4 text-center w-48 border border-yellow-200 dark:border-yellow-800">
                        <p className="font-medium">Email Verified?</p>
                      </div>
                    </div>

                    {/* Final paths */}
                    <div className="flex justify-between">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <p className="text-sm text-gray-500">No</p>
                        <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-4 text-center w-48 border border-red-200 dark:border-red-800">
                          <p className="font-medium">Reminder Email</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <p className="text-sm text-gray-500">Yes</p>
                        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 text-center w-48 border border-green-200 dark:border-green-800">
                          <p className="font-medium">Account Created</p>
                        </div>
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 text-center w-48 border border-green-200 dark:border-green-800">
                          <p className="font-medium">Dashboard</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <h2 className="text-2xl font-semibold mb-4">
                  Resource Sharing Flow
                </h2>
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 w-full max-w-3xl">
                  <div className="flex flex-col space-y-6">
                    {/* Start */}
                    <div className="flex justify-center">
                      <div className="bg-primary/10 rounded-lg p-4 text-center w-48">
                        <p className="font-medium">Dashboard</p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 text-center w-48">
                        <p className="font-medium">Resource Library</p>
                      </div>
                    </div>

                    {/* Paths */}
                    <div className="flex justify-between">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Browse Categories</p>
                        </div>
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">View Resources</p>
                        </div>
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-4 text-center w-48 border border-yellow-200 dark:border-yellow-800">
                          <p className="font-medium">Download/View?</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Upload Resource</p>
                        </div>
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Select Category</p>
                        </div>
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Add Metadata</p>
                        </div>
                      </div>
                    </div>

                    {/* Final paths */}
                    <div className="flex justify-between">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Download File</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Upload File/Link</p>
                        </div>
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Resource Published</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <h2 className="text-2xl font-semibold mb-4">
                  Study Groups Flow
                </h2>
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 w-full max-w-3xl">
                  <div className="flex flex-col space-y-6">
                    {/* Start */}
                    <div className="flex justify-center">
                      <div className="bg-primary/10 rounded-lg p-4 text-center w-48">
                        <p className="font-medium">Dashboard</p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-4 text-center w-48">
                        <p className="font-medium">Study Groups</p>
                      </div>
                    </div>

                    {/* Paths */}
                    <div className="flex justify-between">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Browse Groups</p>
                        </div>
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">View Group</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Create New Group</p>
                        </div>
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Set Group Details</p>
                        </div>
                      </div>
                    </div>

                    {/* Group actions */}
                    <div className="flex justify-between">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Join Group</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Set Schedule</p>
                        </div>
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Invite Members</p>
                        </div>
                      </div>
                    </div>

                    {/* View actions */}
                    <div className="flex justify-between">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">View Discussions</p>
                        </div>
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Post Message</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Group Created</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <h2 className="text-2xl font-semibold mb-4">
                  Search & Navigation Flow
                </h2>
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 w-full max-w-3xl">
                  <div className="flex flex-col space-y-6">
                    {/* Start */}
                    <div className="flex justify-center">
                      <div className="bg-primary/10 rounded-lg p-4 text-center w-48">
                        <p className="font-medium">Dashboard</p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-4 text-center w-48">
                        <p className="font-medium">Search Bar</p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-4 text-center w-48">
                        <p className="font-medium">Enter Search Terms</p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-4 text-center w-48">
                        <p className="font-medium">View Results</p>
                      </div>
                    </div>

                    {/* Decision */}
                    <div className="flex justify-center">
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-4 text-center w-48 border border-yellow-200 dark:border-yellow-800">
                        <p className="font-medium">Filter Results?</p>
                      </div>
                    </div>

                    {/* Paths */}
                    <div className="flex justify-between">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <p className="text-sm text-gray-500">Yes</p>
                        <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Apply Filters</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <p className="text-sm text-gray-500">No</p>
                        <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Select Result</p>
                        </div>
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-4 text-center w-48 border border-yellow-200 dark:border-yellow-800">
                          <p className="font-medium">Result Type?</p>
                        </div>
                      </div>
                    </div>

                    {/* Final paths */}
                    <div className="flex justify-between">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <p className="text-sm text-gray-500">Resource</p>
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">View Resource</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <p className="text-sm text-gray-500">Study Group</p>
                        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">View Group</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <h2 className="text-2xl font-semibold mb-4">
                  User Profile Flow
                </h2>
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 w-full max-w-3xl">
                  <div className="flex flex-col space-y-6">
                    {/* Start */}
                    <div className="flex justify-center">
                      <div className="bg-primary/10 rounded-lg p-4 text-center w-48">
                        <p className="font-medium">Dashboard</p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="bg-teal-100 dark:bg-teal-900/30 rounded-lg p-4 text-center w-48">
                        <p className="font-medium">User Profile</p>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-2 gap-8">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-teal-100 dark:bg-teal-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Edit Profile</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-teal-100 dark:bg-teal-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">View My Resources</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-teal-100 dark:bg-teal-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">View My Groups</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-8 border-l-2 border-gray-300 dark:border-gray-700"></div>
                        <div className="bg-teal-100 dark:bg-teal-900/30 rounded-lg p-4 text-center w-48">
                          <p className="font-medium">Notification Settings</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
