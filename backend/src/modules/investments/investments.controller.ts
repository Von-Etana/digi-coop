import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { investmentsService } from './investments.service';
import { sendSuccess, sendPaginated } from '../../middleware/validator';
import {
    CreateProjectInput,
    UpdateProjectInput,
    InvestInput,
    InvestmentQueryInput
} from './investments.validation';

export class InvestmentsController {
    // ==================== PROJECTS ====================

    /**
     * GET /api/v1/investments/projects
     */
    async getProjects(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const filters: InvestmentQueryInput = req.query as unknown as InvestmentQueryInput;
            const { projects, total } = await investmentsService.getProjects(filters);

            // Calculate funding progress for each project
            const projectsWithProgress = projects.map(project => {
                const invested = parseFloat((project as typeof project & { invested_amount: string }).invested_amount || '0');
                return {
                    ...project,
                    funding_progress: Math.min(100, Math.round((invested / project.target_amount) * 100)),
                    remaining_amount: Math.max(0, project.target_amount - invested),
                };
            });

            sendPaginated(res, projectsWithProgress, {
                page: filters.page || 1,
                limit: filters.limit || 10,
                total,
            }, 'Projects retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/investments/projects/:id
     */
    async getProject(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const project = await investmentsService.getProjectById(req.params.id);

            if (!project) {
                sendSuccess(res, null, 'Project not found', 404);
                return;
            }

            const invested = parseFloat((project as typeof project & { invested_amount: string }).invested_amount || '0');

            sendSuccess(res, {
                ...project,
                funding_progress: Math.min(100, Math.round((invested / project.target_amount) * 100)),
                remaining_amount: Math.max(0, project.target_amount - invested),
            }, 'Project retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/investments/projects (Admin)
     */
    async createProject(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const input: CreateProjectInput = req.body;
            const project = await investmentsService.createProject(req.user.id, input);

            sendSuccess(res, project, 'Project created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/v1/investments/projects/:id (Admin)
     */
    async updateProject(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const input: UpdateProjectInput = req.body;
            const project = await investmentsService.updateProject(req.params.id, input);

            sendSuccess(res, project, 'Project updated successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/investments/projects/:id/investors (Admin)
     */
    async getProjectInvestors(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const investors = await investmentsService.getProjectInvestors(req.params.id);
            sendSuccess(res, investors, 'Investors retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // ==================== INVESTMENTS ====================

    /**
     * POST /api/v1/investments/projects/:id/invest
     */
    async invest(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const input: InvestInput = req.body;
            const investment = await investmentsService.invest(req.user.id, req.params.id, input);

            sendSuccess(res, investment, 'Investment successful', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/investments/my-investments
     */
    async getMyInvestments(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const investments = await investmentsService.getUserInvestments(req.user.id);
            sendSuccess(res, investments, 'Investments retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/investments/portfolio
     */
    async getPortfolio(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const portfolio = await investmentsService.getUserPortfolio(req.user.id);
            sendSuccess(res, portfolio, 'Portfolio retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

export const investmentsController = new InvestmentsController();
