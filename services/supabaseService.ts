import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, RoadmapData, QuizResult, RoadmapWeek, Platform } from '../types';

// --- 1. SETUP CREDENTIALS ---
// Ensure you run `npm install @supabase/supabase-js` to resolve import errors locally.
const supabaseUrl = process.env.SUPABASE_URL || 'https://pyzgwbnfwxizzjhlystm.supabase.co'; 
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5emd3Ym5md3hpenpqaGx5c3RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NTI3MjgsImV4cCI6MjA3OTEyODcyOH0.f4_cds0I2G4baXxBHm8C11UdArWJfyVeUiiOYrujri0';
// --- END SETUP ---

let supabase: SupabaseClient;

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseKey && supabaseUrl !== 'YOUR_SUPABASE_URL';

if (!isSupabaseConfigured) {
    console.warn("⚠️ Supabase URL or Key is missing.");
    supabase = {
        auth: {
            getUser: async () => ({ data: { user: null } }),
            getSession: async () => ({ data: { session: null } }),
            signInWithPassword: async () => ({ error: { message: "Supabase not configured" } }),
            signUp: async () => ({ error: { message: "Supabase not configured" } }),
            signOut: async () => {},
        },
        from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) })
    } as unknown as SupabaseClient;
} else {
    supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        }
    });
}

export { supabase };

// --- HELPER: Map Normalized DB Rows to RoadmapData Object ---
const mapDBToRoadmap = (row: any): RoadmapData => {
    // Sort weeks by week number
    const weeks = row.roadmap_weeks ? row.roadmap_weeks.map((w: any) => ({
        week: w.week_number,
        theme: w.theme,
        goals: w.goals || [],
        completed: w.completed,
        startedAt: w.started_at,
        completedAt: w.completed_at,
        earnedPoints: w.earned_points,
        // Map week-specific resources from separate table
        resources: w.week_resources ? w.week_resources.map((r: any) => ({
             title: r.title,
             searchQuery: r.search_query
        })) : []
    })).sort((a: any, b: any) => a.week - b.week) : [];

    // Filter global resources from separate table
    const globals = row.roadmap_global_resources || [];
    const freePlatforms = globals.filter((r: any) => r.category === 'free').map((r: any) => ({ name: r.name, description: r.description, searchQuery: r.search_query }));
    const paidPlatforms = globals.filter((r: any) => r.category === 'paid').map((r: any) => ({ name: r.name, description: r.description, searchQuery: r.search_query }));
    const books = globals.filter((r: any) => r.category === 'book').map((r: any) => ({ name: r.name, description: r.description, searchQuery: r.search_query }));

    return {
        id: row.id,
        skill: row.skill_name,
        status: row.status as 'active' | 'saved' | 'completed',
        progress: row.progress,
        created_at: row.created_at,
        roadmap: weeks,
        freePlatforms,
        paidPlatforms,
        books
    };
};

// --- PROFILE FUNCTIONS ---

export const getCurrentProfile = async (): Promise<UserProfile | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error || !data) return null;

        return {
            id: user.id,
            fullName: data.full_name,
            academicLevel: data.academic_level,
            stream: data.stream,
            previousPerformance: data.previous_performance,
            interestedSubjects: data.interested_subjects,
            learningStyle: data.learning_style,
            focusArea: data.focus_area,
            lastEdited: data.last_edited_at,
            totalPoints: data.total_points || 0,
            skills: '', 
            interests: '',
            class10Performance: data.class_10_performance,
            class12Stream: data.class_12_stream,
            class12Performance: data.class_12_performance,
            diplomaPerformance: data.diploma_performance,
        };
    } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
    }
};

export const saveProfileFromOnboarding = async (profile: UserProfile) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const profileData = {
        id: user.id,
        full_name: profile.fullName,
        academic_level: profile.academicLevel,
        stream: profile.stream,
        previous_performance: profile.previousPerformance,
        interested_subjects: profile.interestedSubjects,
        learning_style: profile.learningStyle,
        focus_area: profile.focusArea,
        class_10_performance: profile.class10Performance,
        class_12_stream: profile.class12Stream,
        class_12_performance: profile.class12Performance,
        diploma_performance: profile.diplomaPerformance,
        last_edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_points: 0,
    };
    
    // Use upsert for resilience. If a DB trigger created a blank profile, 
    // this will update it. If the trigger failed, this will insert it.
    const { error } = await supabase.from('profiles').upsert(profileData);
    if (error) {
        console.error("Error saving onboarding profile:", error);
        throw error;
    }
};

const updateProfileFromDashboard = async (profile: UserProfile) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const updates = {
        full_name: profile.fullName,
        academic_level: profile.academicLevel,
        stream: profile.stream,
        previous_performance: profile.previousPerformance,
        interested_subjects: profile.interestedSubjects,
        learning_style: profile.learningStyle,
        focus_area: profile.focusArea,
        last_edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) {
        console.error("Error updating dashboard profile:", error);
        throw error;
    }
};


export const updateProfileWithLimit = async (profile: UserProfile): Promise<{ success: boolean, message?: string }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "User not found" };

    if (profile.lastEdited) {
        const lastEditedDate = new Date(profile.lastEdited);
        const now = new Date();
        const diffHours = (now.getTime() - lastEditedDate.getTime()) / (1000 * 60 * 60);
        
        if (diffHours < 24) {
            return { success: false, message: `You can only edit your profile once every 24 hours. Next edit available in ${Math.ceil(24 - diffHours)} hours.` };
        }
    }

    await updateProfileFromDashboard(profile);
    return { success: true };
};

export const updateUserPoints = async (points: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from('profiles').select('total_points').eq('id', user.id).single();
    const currentPoints = data?.total_points || 0;
    const newTotal = currentPoints + points;

    await supabase.from('profiles').update({ total_points: newTotal }).eq('id', user.id);
};

// --- ROADMAP FUNCTIONS (Normalized Relational Storage) ---

export const saveRoadmap = async (skill: string, roadmapData: RoadmapData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Please log in to save roadmaps.");

    // 1. CHECK LIMIT (Max 3 Saved Roadmaps, excluding active one)
    // Explicitly checking for 'saved' status count
    const { count, error: countError } = await supabase
        .from('roadmaps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'saved'); 

    if (count !== null && count >= 3) {
        throw new Error("You have reached the limit of 3 saved roadmaps. Please delete or complete one to save a new one.");
    }

    // 2. INSERT PARENT ROADMAP (Stores Skill & Status)
    const { data: roadmapRow, error: roadmapError } = await supabase
        .from('roadmaps')
        .insert({
            user_id: user.id,
            skill_name: skill,
            status: 'saved', // Default to saved
            progress: 0
        })
        .select()
        .single();

    if (roadmapError || !roadmapRow) throw roadmapError;
    const roadmapId = roadmapRow.id;

    // 3. INSERT WEEKS (Stores Weekly Theme & Goals) & WEEK RESOURCES
    // Using Promise.all for efficiency, though sequential is safer for order (DB sorts by week_number anyway)
    await Promise.all(roadmapData.roadmap.map(async (week) => {
        // a. Insert Week
        const { data: weekRow, error: weekError } = await supabase
            .from('roadmap_weeks')
            .insert({
                roadmap_id: roadmapId,
                week_number: week.week,
                theme: week.theme,
                goals: week.goals, 
                completed: false,
                earned_points: 0
            })
            .select()
            .single();
        
        if (weekError) {
            console.error(`Error saving week ${week.week}:`, weekError);
            return;
        }
        
        // b. Insert Resources for this specific week
        if (weekRow && week.resources && week.resources.length > 0) {
            const resourcesPayload = week.resources.map(r => ({
                week_id: weekRow.id,
                title: r.title,
                search_query: r.searchQuery
            }));
            await supabase.from('week_resources').insert(resourcesPayload);
        }
    }));

    // 4. INSERT GLOBAL RESOURCES (Platforms/Books)
    const globalResources = [
        ...roadmapData.freePlatforms.map(p => ({ ...p, category: 'free' })),
        ...roadmapData.paidPlatforms.map(p => ({ ...p, category: 'paid' })),
        ...roadmapData.books.map(b => ({ ...b, category: 'book' }))
    ];

    if (globalResources.length > 0) {
        const globalPayload = globalResources.map(r => ({
            roadmap_id: roadmapId,
            category: r.category,
            name: r.name,
            description: r.description,
            search_query: r.searchQuery
        }));
        await supabase.from('roadmap_global_resources').insert(globalPayload);
    }
};

export const updateRoadmap = async (roadmap: RoadmapData) => {
    if (!roadmap.id) return;
    
    // 1. Update Main Metadata
    const { error } = await supabase
        .from('roadmaps')
        .update({
            progress: roadmap.progress,
            status: roadmap.status
        })
        .eq('id', roadmap.id);
        
    if (error) console.error("Error updating roadmap metadata:", error);

    // 2. Update Weeks (Progress tracking)
    for (const week of roadmap.roadmap) {
        await supabase
            .from('roadmap_weeks')
            .update({
                completed: week.completed || false,
                started_at: week.startedAt || null,
                completed_at: week.completedAt || null,
                earned_points: week.earnedPoints || 0
            })
            .eq('roadmap_id', roadmap.id)
            .eq('week_number', week.week);
    }
};

export const setRoadmapAsActive = async (roadmapId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. STRICT RULE: Enforce only ONE active roadmap.
    // Downgrade ALL currently active roadmaps for this user to 'saved'
    await supabase
        .from('roadmaps')
        .update({ status: 'saved' })
        .eq('user_id', user.id)
        .eq('status', 'active');

    // 2. Promote the selected roadmap to 'active'
    await supabase
        .from('roadmaps')
        .update({ status: 'active' })
        .eq('id', roadmapId)
        .eq('user_id', user.id);
};

export const getPastRoadmaps = async (limit = 5): Promise<RoadmapData[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // DEEP FETCH: Join all related tables to reconstruct the object
    const { data, error } = await supabase
        .from('roadmaps')
        .select(`
            *,
            roadmap_weeks (
                *,
                week_resources (*)
            ),
            roadmap_global_resources (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit + 1); // Fetch slightly more to handle active + saved list separation in UI if needed

    if (error) {
        console.error("Error fetching roadmaps:", error);
        return [];
    }

    // Convert DB rows back to application RoadmapData format
    return data ? data.map(mapDBToRoadmap) : [];
};

export const saveQuizResult = async (result: QuizResult) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('quiz_results')
        .insert({
            user_id: user.id,
            roadmap_id: result.roadmapId,
            skill_name: result.skill,
            week_theme: result.weekTheme,
            score: result.score,
            total_questions: result.totalQuestions,
            points_earned: result.pointsEarned,
            created_at: new Date().toISOString()
        });
    
    if (result.pointsEarned && result.pointsEarned > 0) {
        await updateUserPoints(result.pointsEarned);
    }

    if (error) {
        console.warn("Error saving quiz result:", error);
    }
};

export const signOut = async () => {
    await supabase.auth.signOut();
};